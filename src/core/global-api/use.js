/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 判断重复安装插件
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      // 当 Vue.use 被调用时，此函数体内 this 指向 Vue
      return this
    }

    // additional parameters
    // 将类数组 arguments 对象转换为数组类型，从索引 1 开始，因为在 initUse 中第一个// 参数是 Vue
    const args = toArray(arguments, 1)

    // 插入 Vue
    args.unshift(this)

    // 调用插件的 install 方法，使其可以使用 Vue
    if (typeof plugin.install === 'function') {
      // 传入包含 Vue 的参数数组
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // 传入包含 Vue 的参数数组
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
