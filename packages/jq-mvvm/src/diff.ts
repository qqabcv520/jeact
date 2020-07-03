import { isVComponent, isVDom, isVElement, isVFunction, isVText, VElement, VNode } from './v-node';
import { isEmpty } from './utils';
import { DomOperate } from './dom';


export class Differentiator {

  constructor(
    private dom: DomOperate
  ) {

  }


  /**
   * 判断input是否有相同的type
   * @param a
   * @param b
   */
  sameInputType (a: VElement, b: VElement) {
    if (a.type !== 'input') {
      return true;
    }
    const aType = a.attributes.type;
    const bType = b.attributes.type;
    if (aType == null && bType == null) {
      return true;
    }
    return aType === bType;
  }

  /**
   * 判断是否是相同的VNode
   * @param a
   * @param b
   */
  sameVNode(a: VNode, b: VNode) {
    if (isVDom(a) && isVDom(b)) {
      return (
        a.key === b.key &&
        a.type === b.type &&
        this.sameInputType(a, b) //  当标签是<input>的时候，type必须相同
      );
    }
    if (isVElement(a) && isVElement(b) && a.type === b.type) {
      return true;
    }
    return !!(isVText(a) && isVText(b));
  }

  /**
   * 根据vNode的key生成map
   * @param children 待生成的vNode数组
   * @param beginIdx 生成范围
   * @param endIdx 生成范围
   */
  createIndexMap(children: VNode[], beginIdx: number, endIdx: number) {
    let i, key;
    const map = new Map<any, number>();
    for (i = beginIdx; i <= endIdx; ++i) {
      key = children[i].key;
      if (key != null) {
        map.set(key, i);
      }
    }
    return map;
  }

  findVNodeIndex(vNodes: VNode[], targetNode: VNode, start: number, end: number) {
    for (let i = start; i < end; i++) {
      const currVNode = vNodes[i];
      if (currVNode != null && this.sameVNode(targetNode, currVNode)) {
        return i;
      }
    }
    return null;
  }

  updateChildren(parentEl: Node, oldChildren: VNode[], newChildren: VNode[], rootUpdate?: () => void) {
    let oldStartIdx = 0;
    let oldStartVNode = oldChildren[0];
    let newStartIdx = 0;
    let newStartVNode = newChildren[0];
    let oldEndIdx = oldChildren.length - 1;
    let oldEndVNode = oldChildren[oldEndIdx];
    let newEndIdx = newChildren.length - 1;
    let newEndVNode = newChildren[newEndIdx];
    let oldKeyToIdx: Map<any, number>;
    let idxInOld: number;
    let vNodeToMove: VNode;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {

      if (oldStartVNode == null) {   // 对于vnode.key的比较，会把oldVnode = null
        oldStartVNode = oldChildren[++oldStartIdx];
      } else if (oldEndVNode == null) {
        oldEndVNode = oldChildren[--oldEndIdx];
      } else if (this.sameVNode(oldStartVNode, newStartVNode)) {
        this.patchVNode(oldStartVNode, newStartVNode);
        oldStartVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (this.sameVNode(oldEndVNode, newEndVNode)) {
        this.patchVNode(oldEndVNode, newEndVNode);
        oldEndVNode = oldChildren[--oldEndIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (this.sameVNode(oldStartVNode, newEndVNode)) { // VNode 右移
        this.patchVNode(oldStartVNode, newEndVNode);
        this.dom.insertBefore(parentEl, oldStartVNode.el, this.dom.nextSibling(newEndVNode.el));
        oldStartVNode = oldChildren[++oldStartIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (this.sameVNode(oldEndVNode, newStartVNode)) { // VNode 左移
        this.patchVNode(oldEndVNode, newStartVNode);
        this.dom.insertBefore(parentEl, oldEndVNode.el, newStartVNode.el);
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else {
        if (oldKeyToIdx === undefined) {
          oldKeyToIdx = this.createIndexMap(oldChildren, oldStartIdx, oldEndIdx);
        }
        // 根据新vNode的key在oldVNode中寻找符合条件的
        idxInOld = newStartVNode.key != null
          ? oldKeyToIdx.get(newStartVNode.key)
          : this.findVNodeIndex(oldChildren, newStartVNode, oldStartIdx, oldEndIdx);
        if (idxInOld == null) { // New element
          newStartVNode.el = this.dom.createElement(newStartVNode, rootUpdate);
          this.dom.insertBefore(parentEl, newStartVNode.el, oldStartVNode.el);
        } else {
          vNodeToMove = oldChildren[idxInOld];
          if (this.sameVNode(vNodeToMove, newStartVNode)) {
            this.patchVNode(vNodeToMove, newStartVNode);
            oldChildren[idxInOld] = undefined;
            this.dom.insertBefore(parentEl, vNodeToMove.el, oldStartVNode.el);
          } else {
            // key相同但是element不同
            newStartVNode.el = this.dom.createElement(newStartVNode, rootUpdate);
            this.dom.insertBefore(parentEl, newStartVNode.el, oldStartVNode.el);
          }
        }
        newStartVNode = newChildren[++newStartIdx];
      }
    }
    if (oldStartIdx > oldEndIdx) {
      const ref = newChildren[newEndIdx + 1];
      const refEl = isVDom(ref) ? ref.el : null;
      for (; newStartIdx <= newEndIdx; newStartIdx++) {
        const el = this.dom.createElement(newChildren[newStartIdx], rootUpdate);
        newChildren[newStartIdx].el = el;
        this.dom.insertBefore(parentEl, el, refEl);
      }
    } else if (newStartIdx > newEndIdx) {
      for (; oldStartIdx <= oldEndIdx; ++oldStartIdx) {
        const child = oldChildren[oldStartIdx];
        if (child != null) {
          this.dom.removeVNode(child);
        }
      }
    }
  }


  /**
   * 对类型相同的的两个node同步
   * @param oldVNode
   * @param newVNode
   * @param rootUpdate
   */
  patchVNode(oldVNode: VNode, newVNode: VNode, rootUpdate?: () => void) {

    const el = newVNode.el = oldVNode.el;
    if (oldVNode === newVNode) {
      return;
    }
    if (isVText(oldVNode) && isVText(newVNode)) {
      this.dom.updateVText(el, newVNode, oldVNode);
      return;
    }
    if (isVDom(oldVNode) && isVDom(newVNode)) {
      this.dom.updateVDom(el, newVNode, oldVNode);
      const oldChildren = oldVNode.children;
      const newChildren = newVNode.children;
      if (!isEmpty(oldChildren) && !isEmpty(newChildren) && oldChildren !== newChildren) {
        this.updateChildren(el, oldChildren, newChildren, rootUpdate);
      } else if (!isEmpty(newChildren)) {
        newChildren.forEach(value => this.dom.appendChild(el, this.dom.createElement(value, rootUpdate)));
      } else if (!isEmpty(oldChildren)) {
        this.dom.removeChildren(el);
      }
      return;
    }
    if (isVComponent(oldVNode) && isVComponent(newVNode)) {
      newVNode.component = oldVNode.component;
      const v = oldVNode.component.runDiff();
      oldVNode.el = v && v.el;
      return;
    }
    if (isVFunction(oldVNode) && isVFunction(newVNode)) {
      newVNode.component = oldVNode.component;
      newVNode.component.functionProps = {
        ...newVNode.attributes,
        ...newVNode.handles,
        children: newVNode.children,
      };
      const v = oldVNode.component.runDiff();
      oldVNode.el = v && v.el;
      return;
    }
  }

  patch(oldVNode: VNode, newVNode: VNode, rootUpdate: () => void) {
    if (this.sameVNode(oldVNode, newVNode)) {
      this.patchVNode(oldVNode, newVNode);
    } else {
      const oldEl = oldVNode.el; // 当前oldVnode对应的真实元素节点
      const parentEl = oldEl.parentNode;  // 父元素
      newVNode.el = this.dom.createElement(newVNode, rootUpdate);  // 根据Vnode生成新元素
      this.dom.insertBefore(parentEl, newVNode.el, oldEl);
      this.dom.removeChild(parentEl, oldEl); // 将新元素添加进父元素
    }
  }
}
