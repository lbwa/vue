/* @flow */
/* globals MessageChannel */

/**
 * 1. 通过 w3c event loops processing model 可知在每次执行完一个 task 之后，将清空
 * microtask，之后若当前上下文是浏览器上下文，接下来 `一定` 会执行渲染进程。
 * 根据 HTML living standard 8.1.4.2.7 第 4 点，在没有视觉效果或没有包含动画回调函
 * 数的情况下将跳过触发浏览器的渲染进程。
 * 2. 故直接使用 macrotask 实现将导致浏览器渲染两次。故 nextTick 默认使用 microtask
 * 3. https://www.w3.org/TR/html5/webappapis.html#event-loops-processing-model
 */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIOS, isNative } from './env'

const callbacks = []
let pending = false

// 执行容器中的 cb 回调函数
function flushCallbacks () {
  pending = false // 重置 pending
  const copies = callbacks.slice(0) // 获取副本
  callbacks.length = 0 // 重置 callbacks 容器
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// Here we have async deferring wrappers using both microtasks and (macro) tasks.
// In < 2.4 we used microtasks everywhere, but there are some scenarios where
// microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690) or even between bubbling of the same
// event (#6566). However, using (macro) tasks everywhere also has subtle problems
// when state is changed right before repaint (e.g. #6813, out-in transitions).
// Here we use microtask by default, but expose a way to force (macro) task when
// needed (e.g. in event handlers attached by v-on).
// ! 在 v-on 附加的事件监听器中，将使用 marcotask 来实现 nextTick
let microTimerFunc
let macroTimerFunc
let useMacroTask = false

// Determine (macro) task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/**
 * ! 优先使用 setImmediate，否则使用 MessageChannel，否则使用 setTimeout
 * ! 通过 MessageChannel 来代替 setImmediate（宏任务异步回调）
 * ! setImmediate 的性能优于 setTimeout，因为不必做超时检测；但存在兼容性问题
 */
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  macroTimerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else if (typeof MessageChannel !== 'undefined' && (
  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'
)) {
  const channel = new MessageChannel()
  const port = channel.port2
  channel.port1.onmessage = flushCallbacks
  macroTimerFunc = () => {
    // 向 channel.port1 发送信息，将会让 channel.port1 的 onmessage 回调注册为 (marco)task
    port.postMessage(1)
  }
} else {
  /* istanbul ignore next */
  macroTimerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

// Determine microtask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  microTimerFunc = () => {
    p.then(flushCallbacks)
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
} else {
  // fallback to macro
  // 在不支持 Promise 的浏览器中默认使用 macrotask 实现 nextTick
  microTimerFunc = macroTimerFunc
}

/**
 * Wrap a function so that if any code inside triggers state change,
 * the changes are queued using a (macro) task instead of a microtask.
 */
export function withMacroTask (fn: Function): Function {
  return fn._withTask || (fn._withTask = function () {
    useMacroTask = true
    const res = fn.apply(null, arguments)
    useMacroTask = false
    return res
  })
}

// vm.$nextTick 自动绑定 ctx 上下文，即 vue 实例
// Vue.nextTick 中 ctx 为可选参数
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve

  // 向容器中添加 cb 回调函数
  /**
   * 建造该容器的原因：
   * 1. 在当前 `event loop` 中可能存在多次调用 nextTick 函数的情况，那么存在的
   * callbacks 容器将当前 `event loop` 中所有传入的 cb 函数集中存储
   * 2. 在当前 `event loop` 中 `仅` 在第一次调用时才会开启调用队列，即开启
   * marcoTimerFunc 或 microTimerFunc
   * 3. 根据 w3c 和 html living standard 中的 event loop processing model 可知，
   * 仅在当前 execution context 为空时，才会执行 perform a microtask checkpoint，
   * 即执行当前 `event loop` 中的 `microtask queue`，即执行 callbacks 容器中存储的
   * 所有 cb 函数
   */
  callbacks.push(() => {
    if (cb) {
      try {
        // 绑定执行上下文
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      // _resolve 为 resolve 函数或 undefined
      _resolve(ctx)
    }
  })

  // 执行 nextTick 的回调函数容器中的函数
  if (!pending) {
    pending = true

    // ! 执行传入的 cb 函数
    if (useMacroTask) {
      macroTimerFunc()
    } else {
      // ! 为了避免不必要的多次 vnode 重绘，nextTick 默认使用 microtask 实现
      microTimerFunc()
    }
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    // 在未传入 cb 函数且执行环境支持 Promise 时，使用 _resolve 缓存 resolve 函数
    // 配合 callback.push() 使用可起到在未传入 cb 函数时，将返回一个 Promise 实例。
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
