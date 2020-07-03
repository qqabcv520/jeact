import { isVComponent, isVDom, isVElement, isVFunction, isVText, VDom, VNode, VText } from './v-node';
import { Component, FunctionComponent } from './component';

export class DomOperate {

  constructor(private context: Component) { }

  createElement(vNode: VText, rootUpdate: () => void): Text;
  createElement(vNode: VDom, rootUpdate: () => void): HTMLElement;
  createElement(vNode: VNode, rootUpdate: () => void): Node;
  createElement(vNode: VNode, rootUpdate: () => void): any {
    if (isVComponent(vNode)) {
      vNode.component = Component.create(vNode.type, {
        ...vNode.attributes,
        ...vNode.handles,
        children: vNode.children,
        rootUpdate,
      });
      vNode.el = vNode.component.vNode?.el;
      return vNode.el;
    } else if (isVFunction(vNode)) {
      vNode.component = Component.create<FunctionComponent<any>>(FunctionComponent, {
        renderFunction: vNode.type,
        functionProps: {
          ...vNode.attributes,
          ...vNode.handles,
          children: vNode.children,
        },
        rootUpdate,
      });
      vNode.el = vNode.component.vNode?.el;
      return vNode.el;
    } else if (isVDom(vNode)) {
      const el: HTMLElement = document.createElement(vNode.type);
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
      vNode.children?.forEach(value => {
        const node = this.createElement(value, rootUpdate);
        if (node) {
          el.appendChild(node);
        }
      });
      return el;
    } else if (isVText(vNode)) {
      vNode.el = document.createTextNode(vNode.content);
      return vNode.el;
    }
  }

  /**
   *
   * @param el VNode对应的真是dom
   * @param newVNode
   * @param oldVNode
   */
  updateVDom(el: Node, newVNode: VDom, oldVNode: VDom) {
    if (isVDom(newVNode) && isVDom(oldVNode) && el instanceof HTMLElement) {
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
          this.removeAttribute(el, key, oldVNode.attributes[key]);
        }
      });

      Object.keys(newVNode.attributes).forEach(key => {
        const value = newVNode.attributes[key];
        const oldValue = oldVNode.attributes[key];
        if (value === oldValue) {
          return;
        } else if (value && value !== 0) {
          this.setAttribute(el, key, value, oldValue);
        } else {
          this.removeAttribute(el, key, oldValue);
        }
      });
    } else if (isVText(newVNode) && isVText(oldVNode) && newVNode.content !== oldVNode.content) {
      newVNode.el.data = newVNode.content;
    }
  }

  updateVText(el: Node, newVNode: VText, oldVNode: VText) {
    if (newVNode.content !== oldVNode.content) {
      newVNode.el.data = newVNode.content;
    }
  }


  setAttribute(el: Element, attrName: string, attrValue: any, oldValue: any = {}) {
    if (el instanceof HTMLInputElement && el.type === 'checkbox' && attrName === 'checked') {
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
    if (typeof attrValue !== 'string' && el instanceof HTMLElement && attrName === 'style') {
      Object.keys(oldValue).forEach(key => {
        if (!attrValue.hasOwnProperty(key)) {
          el.style[key] = '';
        }
      });
      Object.keys(attrValue).forEach(key => {
        const value = attrValue[key];
        if (value === oldValue[key]) {
          return;
        } else if (value && value !== 0) {
          el.style[key] = value;
        } else {
          el.style[key] = '';
        }
      });
      return;
    }
    if (attrName === 'ref') {
      this.context.refs[attrValue] = el;
    }
    if (attrValue && attrValue !== 0) {
      el.setAttribute(attrName, String(attrValue === true ? '' : attrValue));
    }
  }

  removeAttribute(el: HTMLElement, attrName: string, oldValue: any = {}) {
    if (el instanceof HTMLInputElement && el.type === 'checkbox' && attrName === 'checked') {
      el[attrName] = false;
      return;
    }
    if (el instanceof HTMLInputElement && attrName === 'value') {
      el[attrName] = '';
      return;
    }
    if (attrName === 'dangerouslySetInnerHTML') {
      el.innerHTML = '';
      return;
    }
    if (el instanceof HTMLElement && attrName === 'style') {
      Object.keys(oldValue).forEach(key => {
        el.style[key] = '';
      });
      return;
    }
    el.removeAttribute(attrName);
  }

  // 移除el的所有子节点
  removeChildren(el: Node) {
    const children = el.childNodes;
    for (let i = children.length - 1; i >= 0; i--) {
      this.removeChild(el, children[i]);
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
    if (isVComponent(vNode) || isVFunction(vNode)) {
      this.callDestroy(vNode);
    }
    const pNode = this.parentNode(vNode.el);
    if (pNode) {
      this.removeChild(pNode, vNode.el);
    }
  }

  // 递归销毁所有子节点
  callDestroy(vnode: VNode) {
    if (isVElement(vnode)) {
      for (let i = 0; i < vnode.children.length; ++i) {
        this.callDestroy(vnode.children[i]);
      }
    }
    if (isVComponent(vnode)) {
      if (vnode.component?.vNode) {
        this.callDestroy(vnode.component?.vNode);
        vnode.component.destroy();
      }
    }
  }

}
