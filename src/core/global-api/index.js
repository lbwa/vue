/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // Object.create(null) 创建一个没有隐式原型的对象（没有__proto__）
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  /**
   * 将第一参数中所有属性及其值复制给第二参数（通过 for in 实现。shared/util）
   * Vue.options.components.KeepAlive = { name: 'keep-alive' ...}
   */
  extend(Vue.options.components, builtInComponents)

  // Vue.use = function (plugin) {}
  initUse(Vue)

  // Vue.mixin = function (Vue) {}
  initMixin(Vue)

  /**
   * Vue.cid = 0
   * let cid = 1
   * Vue.extend = function (extendOptions) {}
   */
  initExtend(Vue)

  /**
   * ASSET_TYPES = [
   *    'component',
   *    'directive',
   *    'filter'
   * ]
   * 调用 ASSET_TYPES.forEach(),
   * 其中操作为：
   * Vue.component = function () {}
   * Vue.directive = function () {}
   * Vue.filter = function () {}
   */
  initAssetRegisters(Vue)
}
