import { VNode } from './v-node';
import { DomOperate } from './dom';
import { Differentiator } from './diff';

export type Type<T> = new (...args: any[]) => T;

export interface ComponentProps {
  el?: HTMLElement;
  children?: VNode[];
  rootUpdate: () => void;
}

export interface ValueComponentProps<T> extends ComponentProps {
  valueChange: (options: T) => void;
}

export abstract class Component {
  private updateFlag = false;
  protected readonly dom = new DomOperate(this);
  protected readonly diff = new Differentiator(this.dom);
  el: HTMLElement;
  readonly refs: {
    [key: string]: Element | Component;
  } = {};

  readonly rootUpdate?: () => void;
  children?: VNode[];
  vNode: VNode | null;

  constructor(args: ComponentProps) {
    if (args) {
      Object.assign(this, args);
    }
  }

  static create<T extends Component>(componentType: Type<T>, props: Partial<T>, el?: HTMLElement | string): T {
    const dom = typeof el === 'string' ? document.querySelector(el) : el;
    const component = new componentType({...props});
    component.el = dom as HTMLElement;
    component.beforeMount();
    component.mount();
    component.mounted();
    return component;
  }

  protected mount() {
    this.vNode = this.render();
    const node = this.dom.createElement(this.vNode, this.update.bind(this));
    this.appendToEl(node);
  }

  appendToEl(node: Node) {
    if (this.el && node) {
      this.dom.appendChild(this.el, node);
    }
  }

  reappendToEl(oldNode: Node, newNode: Node) {
    if (oldNode === newNode || this.el == null) {
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
    if (this.updateFlag) {
      return;
    }
    this.updateFlag = true;
    Promise.resolve().then(() => {
      this.updateFlag = false;
      if (this.rootUpdate) {
        this.rootUpdate();
        return;
      }
      this.runDiff();
    });
  }

  runDiff() {
    if (this.vNode == null || this.vNode.el == null) {
      return null;
    }
    const newVNode = this.render();
    this.diff.patch(this.vNode, newVNode, this.update.bind(this));
    this.reappendToEl(this.vNode.el, newVNode.el);
    this.vNode = newVNode;
    return newVNode;
  }

  beforeMount() {
  }

  mounted() {
  }

  beforeUpdate() {
  }

  updated() {
  }

  destroy() {
  }

  render(): VNode | null {
    return null;
  }

}


export abstract class ValueComponent<T> extends Component {


  readonly el: HTMLInputElement;
  protected valueChange: (options: T) => void;

  abstract writeValue(value: string): void;

  protected constructor(props: ValueComponentProps<T>) {
    super(props);
    this.valueChange = props.valueChange;
  }

  mount() {
    if (this.el) {
      this.writeValue(this.el.value);
    }
    super.mount();
  }

  readValue(value: any): string {
    return value != null ? String(value) : '';
  }

  onChange(value: T) {
    if (this.valueChange) {
      this.valueChange(value);
    }
    if (this.el) {
      this.el.value = this.readValue(value);
      this.el.dispatchEvent(new InputEvent('input'));
      this.el.dispatchEvent(new UIEvent('change'));
    }

  }

  appendToEl(node: HTMLElement) {
    const parentNode = this.el && this.dom.parentNode(this.el);
    if (parentNode && node) {
      this.dom.insertBefore(parentNode, node, this.el);
      this.el.hidden = true;
    }
  }

}


export class FunctionComponent<T> extends Component {

  functionProps: T;
  renderFunction: (T) => VNode;

  render(): VNode {
    return this.renderFunction(this.functionProps);
  }
}


