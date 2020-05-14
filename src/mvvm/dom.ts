import { isVElement, isVText, VElement, VNode, VText } from './v-node';
import { Component } from './component';

export class DomOperate {

  constructor(private context: Component) {

  }

  createElement(vNode: VText): Text;
  createElement(vNode: VElement): HTMLElement;
  createElement(vNode: VNode): Node
  createElement(vNode: VNode): any {
    if (isVElement(vNode)) {
      const el: HTMLElement = document.createElement(vNode.tagName);
      vNode.el = el;
      Object.keys(vNode.handles).forEach(key => {
        const value = vNode.handles[key];
        const handleName = key.toLowerCase().replace(/^on/, '');
        el.addEventListener(handleName, value);
      });
      Object.keys(vNode.attributes).forEach(key => {
        const value = vNode.attributes[key];
        this.setAttribute(el, key, value);
      });
      vNode.children && vNode.children.forEach(value => {
        el.appendChild( this.createElement(value));
      });
      return el;
    } else if (isVText(vNode)) {
      vNode.el = document.createTextNode(vNode.content);
      return vNode.el;
    }
  }

  updateElement(el: Node, newVNode: VNode, oldVNode: VNode) {
    if (isVElement(newVNode) && isVElement(oldVNode) && el instanceof HTMLElement) {
      Object.keys(oldVNode.handles).forEach(key => {
        if (!newVNode.handles.hasOwnProperty(key)) {
          const value = oldVNode.handles[key];
          const handleName = key.toLowerCase().replace(/^on/, '');
          el.removeEventListener(handleName, value);
        }
      });
      Object.keys(newVNode.handles).forEach(key => {
        const handleName = key.toLowerCase().replace(/^on/, '');
        const value = newVNode.handles[key];
        const oldValue = oldVNode.handles[key];
        if (value === oldValue) {
          return;
        }
        if (oldVNode.handles.hasOwnProperty(key)) {
          el.removeEventListener(handleName, oldValue);
        }
        el.addEventListener(handleName, value);
      });
      Object.keys(oldVNode.attributes).forEach(key => {
        if (!newVNode.attributes.hasOwnProperty(key)) {
          this.removeAttribute(el, key);
        }
      });

      Object.keys(newVNode.attributes).forEach(key => {
        const value = newVNode.attributes[key];
        if (value === oldVNode.attributes[key]) {
          return;
        } else if (value && value !== 0) {
          this.setAttribute(el, key, value);
        } else {
          this.removeAttribute(el, key);
        }
      });
    } else if (isVText(newVNode) && isVText(oldVNode) && newVNode.content != oldVNode.content) {
      newVNode.el.data = newVNode.content;
    }
  }


  setAttribute(el: Element, attrName: string, attrValue: any) {
    if (el instanceof HTMLInputElement &&  el.type === 'checkbox' && attrName === 'checked') {
      el['checked'] = attrValue;
      return;
    }
    if (el instanceof HTMLInputElement && attrName === 'value') {
      el['value'] = attrValue;
      return;
    }
    if (attrName === 'dangerouslySetInnerHTML') {
      el.innerHTML = attrValue;
      return;
    }
    if (attrName === 'ref') {
      this.context.refs[attrValue] = el;
    }
    attrValue && attrValue !== 0 && el.setAttribute(attrName, String(attrValue === true ? '' : attrValue));
  }

  removeAttribute(el: HTMLElement, attrName: string) {
    if (el instanceof HTMLInputElement &&  el.type === 'checkbox' && attrName === 'checked') {
      el['checked'] = false;
      return;
    }
    if (el instanceof HTMLInputElement && attrName === 'value') {
      el['value'] = '';
      return;
    }
    if (attrName === 'dangerouslySetInnerHTML') {
      el.innerHTML = '';
      return;
    }
    el.removeAttribute(attrName);
  }

  removeChildren(el: Node) {
    const children = el.childNodes;
    for (let i = children.length-1; i >= 0; i--) {
      this.removeChild(el, children[i])
    }
  }

  appendChild(parentNode: Node, childNode: Node) {
    parentNode.appendChild(childNode);
  }

  removeChild(parentNode: Node, childNode: Node) {
    parentNode.removeChild(childNode);
  }

  insertBefore(parentNode: Node, newNode: Node, referenceNode: Node) {
    parentNode.insertBefore(newNode, referenceNode);
  }

  parentNode(node: Node): Node {
    return node.parentNode;
  }

  nextSibling(node: Node) {
    return node.nextSibling;
  }


  removeVNode(vNode: VNode) {
    // todo 调用销毁hook
    const pNode = this.parentNode(vNode.el);
    pNode && this.removeChild(pNode, vNode.el);
  }

}
