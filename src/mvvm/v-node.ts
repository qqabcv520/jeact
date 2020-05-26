
const handleTypes = [
  'onclick', 'onClick',
  'onchange', 'onChange',
  'oninput', 'onInput',
  'onfocus', 'onFocus',
  'onblur', 'onBlur',
];
// const inputAttributes = ['checked'];


export interface VNode {
  el: Node;
  key: any;
}

export class VElement implements VNode{
  el: HTMLElement;
  key: any;
  ref: string;
  constructor(
    public tagName: string,
    public attributes: { [key: string]: any } = {},
    public handles: { [key: string]: () => void } = {},
    public children: VNode[] = []
  ) { }
}

export class VText implements VNode{
  el: Text;
  content: string;
  key: any;
  constructor(
    content: any,
  ) {
    this.content = String(content || content === 0 ? content : '');
  }
}





export function createVNode(tagName: string, props: { [key: string]: any } , ...children: any[]) {
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
  return new VElement(tagName, attribute, handle, vNodeChildren);
}

export function isVElement(vNode: VNode): vNode is VElement {
  return vNode && (<VElement>vNode).tagName !== undefined;
}

export function isVText(vNode: VNode): vNode is VText {
  return vNode && (<VText>vNode).content !== undefined;
}
