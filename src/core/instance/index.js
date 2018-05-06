import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }

  // this 指向 vue 实例。 const ins = new Vue()
  this._init(options)
}

// 向 Vue 原型上挂载 _init 方法
// Vue.prototype._init = function (options?: object) {}
initMixin(Vue)

/**
 * 定义 vue $data $props $watch
 * Object.defineProperty(Vue.prototype, '$data', dataDef)
 * Object.defineProperty(Vue.prototype, '$props', propsDef)
 * Vue.prototype.$set = set
 * Vue.prototype.$delete = del
 * Vue.prototype.$watch = function (expOrFn, cb, options) {}
 */
stateMixin(Vue)

/**
 * 定义事件相关方法
 * Vue.prototype.$on = function (event, fn) {}
 * Vue.prototype.$once = function (event, fn) {}
 * Vue.prototype.$off = function (event?, fn?) {}
 * Vue.prototype.$emit = function (event) {}
 */
eventsMixin(Vue)

/**
 * 定义生命周期相关方法
 * Vue.prototype._update = function(VNode, hydrating)
 * Vue.prototype.$forceUpdate = function () {}
 * Vue.prototype.$destroy = function () {}
 */
lifecycleMixin(Vue)

/**
 * installRenderHelpers 函数
 * Vue.prototype._o = markOnce
 * Vue.prototype._n = toNumber
 * Vue.prototype._s = toString
 * Vue.prototype._l = renderList
 * Vue.prototype._t = renderSlot
 * Vue.prototype._q = looseEqual
 * Vue.prototype._i = looseIndexOf
 * Vue.prototype._m = renderStatic
 * Vue.prototype._f = resolveFilter
 * Vue.prototype._k = checkKeyCodes
 * Vue.prototype._b = bindObjectProps
 * Vue.prototype._v = createTextVNode
 * Vue.prototype._e = createEmptyVNode
 * Vue.prototype._u = resolveScopedSlots
 * Vue.prototype._g = bindObjectListeners
 */

/**
 * 定义渲染方法
 * 执行 installRenderHelpers(Vue.prototype)
 * Vue.prototype.$nextTick = function (fn) {}
 * Vue.prototype._render = function () {}
 */
renderMixin(Vue)

export default Vue
