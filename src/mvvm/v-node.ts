import { Component, FunctionComponent, Type } from './component';

const handleTypes = [
  'onclick', 'onClick',
  'onchange', 'onChange',
  'oninput', 'onInput',
  'onfocus', 'onFocus',
  'onblur', 'onBlur',
];
// const inputAttributes = ['checked'];


export abstract class VNode {
  el: Node;
  key: any;
}


export class VElement extends VNode {
  el: HTMLElement;
  key: any;
  ref: string;
  constructor(
    public type: string | Function | Type<any>,
    public attributes: { [key: string]: any } = {},
    public handles: { [key: string]: () => void } = {},
    public children: VNode[] = []
  ) {
    super();
  }
}

export interface VFunction {
  el: Node;
  key: any;
  ref: string;
  type: () => VNode;
  component: FunctionComponent<any>;
  attributes: { [key: string]: any };
  handles: { [key: string]: () => void };
  children: VNode[];
}

export interface VDom {
  el: HTMLElement;
  key: any;
  ref: string;
  type: string;
  attributes: { [key: string]: any };
  handles: { [key: string]: () => void };
  children: VNode[];
}


export interface VComponent<T extends Component = any> {
  el: Node;
  key: any;
  ref: string;
  type: Type<T>;
  component: T;
  attributes: { [key: string]: any };
  handles: { [key: string]: () => void };
  children: VNode[];
}

export class VText extends VNode {
  el: Text;
  content: string;
  key: any;
  constructor(
    content: any,
  ) {
    super();
    this.content = String(content || content === 0 ? content : '');
  }
}


export function createVNode(type: string | Function | Type<Component>, props: { [key: string]: any } , ...children: any[]) {
  let handle = {};
  let attribute = {};
  if (props) {
    handle = Object.keys(props).filter(value => handleTypes.includes(value)).reduce((pre, curr) => {
      pre[curr] = props[curr];
      return pre;
    }, {});
    attribute = Object.keys(props).filter(value => !handleTypes.includes(value)).reduce((pre, curr) => {
      pre[curr] = props[curr];
      return pre;
    }, {});
  }
  const vNodeChildren = children.flat(2).map(value => {
    return isVElement(value) ? value : new VText(value);
  });
  return new VElement(type, attribute, handle, vNodeChildren);
}


export function isVNode(vNode: any): vNode is VNode {
  return vNode instanceof VNode;
}

export function isVElement(vNode: VNode): vNode is VElement {
  return vNode && (<VElement>vNode).type != null;
}

export function isVText(vNode: VNode): vNode is VText {
  return vNode && (<VText>vNode).content !== undefined;
}

export function isVDom(vNode: VNode): vNode is VDom {
  return isVElement(vNode) && typeof vNode.type === 'string';
}

export function isVComponent(vNode: VNode): vNode is VComponent<Component> {
  return isVElement(vNode) && typeof vNode.type === 'function' && vNode.type.prototype && vNode.type.prototype.render;
}

export function isVFunction(vNode: VNode): vNode is VFunction {
  return isVElement(vNode) && typeof vNode.type === 'function' && !(vNode.type.prototype && vNode.type.prototype.render);
}
