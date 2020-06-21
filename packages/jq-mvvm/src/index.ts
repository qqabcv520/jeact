/**
 * 简易的MVVM插件
 * 可直接嵌入到任何JS代码中，把某个DOM和其子节点设置为MVVM管理
 *
 * author mifan
 */


export { mountComponent } from './utils';
export { Component, ValueComponent, Type, ComponentProps, ValueComponentProps } from './component';
export { VNode, VDom, VText, createVNode, isVNode } from './v-node';
