/* @flow */

// 只是引入的 Watcher 类型！！并没有把 Watcher import 进本模块
import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  // 此处将 Dep 本身的静态属性 target 与 Watcher 联系了起来
  static target: ?Watcher;
  id: number;
  // 存储依赖收集器中需要通知的 Watcher 实例
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    // 为当前依赖收集器添加 Watcher
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    // 此处的 Dep.target 由本模块的 pushTarget 函数传入
    if (Dep.target) {
      // this 为 Dep 实例
      /**
       * 调用 Dep.target.addDep() 即是调用 Watcher 原型的方法，在 addDep() 中记录当
       * 前 dep 实例和 dep id，之后在 addDep() 中调用 dep.addSubs(this),那么此时
       * dep 也记录了当前 Watcher 实例，将当前 Watcher 实例存入 dep.subs 中。
       */
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    // 首先固定（或理解为冻结） subs 队列，防止下面 for 循环中无限循环
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      // 通知依赖收集器中所有 Watcher，调用其 update 方法
      subs[i].update()
    }
  }
}

// the current target watcher being evaluated.
// 最近被评估的的目标 watcher
// this is globally unique because there could be only one
// 这是全局唯一的一个，因为在任何时候只有唯一的一个 watcher 被评估
// watcher being evaluated at any time.
Dep.target = null
const targetStack = []

export function pushTarget (_target: ?Watcher) {
  // 此处将 Dep 本身的静态属性 target 与 Watcher 联系了起来
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

export function popTarget () {
  Dep.target = targetStack.pop()
}
