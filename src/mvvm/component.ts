import { VNode } from './v-node';
import { DomOperate } from './dom';
import { Differentiator } from './diff';

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export interface ComponentProps {
  el?: HTMLElement;
  children?: VNode[];
  rootUpdate: () => void;
}

export interface ValueComponentProps<T> extends ComponentProps {
  valueChange: (options: T) => void;
}

export abstract class Component {
  protected vNode: VNode;
  private updateFlag = false;
  protected readonly dom = new DomOperate(this);
  protected readonly diff = new Differentiator(this.dom);
  readonly el: HTMLElement;
  readonly refs: {
    [key: string]: Element | Component;
  } = {};

  readonly rootUpdate?: () => void;
  children?: VNode[];

  constructor(args: ComponentProps) {
    if (args) {
      Object.assign(this, args);
    }
  }

  protected mount() {
    this.vNode = this.render();
    const node = this.dom.createElement(this.vNode, this.update.bind(this));
    this.appendToEl(node);
  }

  appendToEl(node: Node) {
    this.el && node && this.dom.appendChild(this.el, node);
  }

  reappendToEl(oldNode: Node, newNode: Node) {
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
    })
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

  beforeMount() {};

  mounted() {};

  beforeUpdate() {};

  updated() {};

  destroy() {};

  render(): VNode {
    return null;
  };


  static create<T extends Component>(componentType: Type<T>, props: Partial<T>, el?: HTMLElement): T {
    const component = new componentType({...props, el});
    component.beforeMount();
    component.mount();
    component.mounted();
    return component;
  }
}



export abstract class ValueComponent<T> extends Component {

  abstract writeValue(value: string): void;
  readonly el: HTMLInputElement;
  protected valueChange: (options: T) => void;

  protected constructor(args: ValueComponentProps<T>) {
    super(args);
    this.valueChange = args.valueChange;
  }

  mount() {
    super.mount();
    if (this.el) {
      this.writeValue(this.el.value);
    }
  }

  readValue(value: any): string {
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



export class FunctionComponent<T> extends Component {

  functionProps: T;
  renderFunction: (T) => VNode;

  render(): VNode {
    return this.renderFunction(this.functionProps);
  }
}


