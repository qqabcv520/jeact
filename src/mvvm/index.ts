

import '../index.css';
import { VElement } from './v-node';
import { Differentiator } from './diff';
import { DomOperate } from './dom';

/**
 * 简易的MVVM插件
 * 可直接嵌入到任何JS代码中，把某个DOM和其子节点设置为MVVM管理
 *
 * author mifan
 *
 */




export class Component {
  private vNode: VElement;
  private updateFlag = false;
  private readonly dom = new DomOperate(this);
  private readonly diff = new Differentiator(this.dom);
  readonly el: HTMLElement;
  readonly refs: {
    [key: string]: Element | Component;
  } = {};

  protected constructor(args: any) {
    this.el = args.el;
  }

  private mount() {
    this.vNode = this.render();
    const node = this.dom.createElement(this.vNode);
    this.el && node && this.dom.appendChild(this.el, node);
  }

  update() {
    if (!this.vNode) {
      return;
    }
    if (this.updateFlag) {
      return;
    }
    this.updateFlag = true;
    Promise.resolve().then(() => {
      this.updateFlag = false;
      const newVNode = this.render();
      this.diff.patch(this.vNode, newVNode);
      this.vNode = newVNode;
    })
  }

  init() {}

  mounted() {}

  render(): VElement {
    return null;
  }


  static create<T extends typeof Component>(componentType: T, props: any, el?: HTMLElement) {
    const component = new componentType({...props, el});
    component.init();
    component.mount();
    component.mounted();
    return component;
  }
}
