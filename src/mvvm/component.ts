import { VElement } from './v-node';
import { DomOperate } from './dom';
import { Differentiator } from './diff';

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export interface ComponentProps {
  el: HTMLElement;
}

export interface ValueComponentProps<T> extends ComponentProps {
  valueChange: (options: T) => void;
}

export class Component {
  private vNode: VElement;
  private updateFlag = false;
  protected readonly dom = new DomOperate(this);
  protected readonly diff = new Differentiator(this.dom);
  readonly el: HTMLElement;
  readonly refs: {
    [key: string]: Element | Component;
  } = {};

  protected constructor(args: ComponentProps) {
    this.el = args.el;
  }

  protected mount() {
    this.vNode = this.render();
    const node = this.dom.createElement(this.vNode);
    this.appendToEl(node);
  }

  appendToEl(node: HTMLElement) {
    this.el && node && this.dom.appendChild(this.el, node);
  }

  reappendToEl(oldNode: HTMLElement, newNode: HTMLElement) {
    if (oldNode == newNode || this.el == null) {
      return;
    }
    const parentNode = this.dom.parentNode(oldNode);
    if (parentNode == null) {
      return;
    }
    this.dom.removeChild(parentNode, oldNode);
    this.appendToEl(newNode);
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
      this.reappendToEl(this.vNode.el, newVNode.el);
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



export abstract class ValueComponent<T> extends Component {

  abstract writeValue(value: string);
  readonly el: HTMLInputElement;
  protected valueChange: (options: T) => void;

  protected constructor(args: ValueComponentProps<T>) {
    super(args);
    this.valueChange = args.valueChange;
  }

  mount() {
    super.mount();
    this.writeValue(this.el.value);
  }

  readValue(value): string {
    return value ? String(value) : '';
  }

  onChange(value: T) {
    this.el.value = this.readValue(value);
    if (this.valueChange) {
      this.valueChange(value);
    }
  }

  appendToEl(node: HTMLElement) {
    const parentNode = this.el && this.dom.parentNode(this.el);
    if (parentNode != null) {
      node && this.dom.insertBefore(parentNode, node, this.el);
      this.el.hidden = true;
    }
  }

}


