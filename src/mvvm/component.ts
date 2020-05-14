import { VElement } from './v-node';
import { DomOperate } from './dom';
import { Differentiator } from './diff';


export interface Type<T> extends Function {
  new (...args: any[]): T;
}


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

  beforeMount() {}

  mounted() {}

  render(): VElement {
    return null;
  }


  static create<T extends Component>(componentType: Type<T>, props: any, el?: HTMLElement): T {
    const component = new componentType({...props, el});
    component.beforeMount();
    component.mount();
    component.mounted();
    return component;
  }
}



