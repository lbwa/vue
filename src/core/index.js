
// 此时的 Vue 原型上，已经初始化了一些方法和属性
import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

// 初始化全局 API 如 Vue.config 等
initGlobalAPI(Vue)

// 定义检测是否为服务器环境
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  // 属性描述符默认值，不可更改描述符，不可枚举
  value: FunctionalRenderContext
})

Vue.version = '__VERSION__'

export default Vue
