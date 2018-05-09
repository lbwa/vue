/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

// 向 Vue 原型上挂载 _init 方法
export function initMixin (Vue: Class<Component>) {
  // options 即为实例化 Vue 时传入的参数对象
  Vue.prototype._init = function (options?: Object) {
    // vm ，即调用 new Vue() 时 Vue 构造函数中的 this，即 Vue 实例（因为 ./index 中
    // 有 this._init(options)）
    const vm: Component = this

    // a uid
    vm._uid = uid++

    // web performance API 用于测量杨业和 web 应用程序的性能
    let startTag, endTag
    /* istanbul ignore if */
    // 非生产环境 && 开启记录 perf && 在浏览器环境中（因为存在 window.performance）
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`

      // src/core/util/perf.js
      // mark = tag => (inBrowser && window.performance).mark(tag)
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true

    // merge options
    // options 参数是 new Vue() 传入的参数对象
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // 优化内部组件实例化过程
      // since dynamic options merging is pretty slow, and none of the
      // 因为动态选项合并实在太慢了，所有的内部组件选项都不需要特殊对待
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // 将 options 合并
      // mergeOptions(parent, child, vm) 返回一个新的 options 对象
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm

    /**
     * vm.$parent = parent
     * vm.$root = parent ? parent.$root : vm
     * vm.$children = []
     * vm.$refs = {}
     * vm._watcher = null
     * vm._inactive = null
     * vm._directInactive = false
     * vm._isMounted = false
     * vm._isDestroyed = false
     * vm._isBeingDestroyed = false
     */
    initLifecycle(vm)

    /**
     * vm._events = Object.create(null) // 没有 __proto__ 的对象
     * vm._hasHookEvent = false
     */
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')

    // inject 选项，需与其他祖先组件的 provide 选项一起使用
    initInjections(vm) // resolve injections before data/props
    initState(vm)

    // provide 选项，需与其他后代组件的 inject 选项一起使用
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  // Object.create(A) 以对象A为对象原型创建一个新的对象
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const extended = Ctor.extendOptions
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = dedupe(latest[key], extended[key], sealed[key])
    }
  }
  return modified
}

function dedupe (latest, extended, sealed) {
  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    const res = []
    sealed = Array.isArray(sealed) ? sealed : [sealed]
    extended = Array.isArray(extended) ? extended : [extended]
    for (let i = 0; i < latest.length; i++) {
      // push original options and not sealed options to exclude duplicated options
      if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i])
      }
    }
    return res
  } else {
    return latest
  }
}
