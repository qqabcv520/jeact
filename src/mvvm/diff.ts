import { VNode, VElement, isVText, isVElement } from './v-node';
import { isEmpty } from '../utils';
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
    if (a.tagName !== 'input') {
      return true;
    }
    const aType = a.attributes.type;
    const bType = b.attributes.type;
    if (aType == null && bType == null) {
      return true;
    }
    return aType == bType;
  }

  /**
   * 判断是否是相同的VNode
   * @param a
   * @param b
   */
  sameVNode(a: VNode, b: VNode) {
    if (isVElement(a) && isVElement(b)) {
      return (
        a.key === b.key &&
        a.tagName === b.tagName &&
        this.sameInputType(a, b) //  当标签是<input>的时候，type必须相同
      );
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
    return map
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

  updateChildren(parentEl: Node, oldChildren: VNode[], newChildren: VNode[]) {
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

    // todo 重复的key显示warning
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {

      if (oldStartVNode == null) {   // 对于vnode.key的比较，会把oldVnode = null
        oldStartVNode = oldChildren[++oldStartIdx]
      }else if (oldEndVNode == null) {
        oldEndVNode = oldChildren[--oldEndIdx]
      }else if (this.sameVNode(oldStartVNode, newStartVNode)) {
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
        if (oldKeyToIdx == undefined) {
          oldKeyToIdx = this.createIndexMap(oldChildren, oldStartIdx, oldEndIdx);
        }
        // 根据新vNode的key在oldVNode中寻找符合条件的
        // idxInOld = oldKeyToIdx.get(newStartVNode.key);
        idxInOld = newStartVNode.key != null
          ? oldKeyToIdx.get(newStartVNode.key)
          : this.findVNodeIndex(oldChildren, newStartVNode, oldStartIdx, oldEndIdx);
        if (idxInOld == null) { // New element
          newStartVNode.el = this.dom.createElement(newStartVNode);
          this.dom.insertBefore(parentEl, newStartVNode.el, oldStartVNode.el);
        } else {
          vNodeToMove = oldChildren[idxInOld];
          if (this.sameVNode(vNodeToMove, newStartVNode)) {
            this.patchVNode(vNodeToMove, newStartVNode);
            oldChildren[idxInOld] = undefined;
            this.dom.insertBefore(parentEl, vNodeToMove.el, oldStartVNode.el);
          } else {
            // key相同但是element不同
            newStartVNode.el = this.dom.createElement(newStartVNode);
            this.dom.insertBefore(parentEl, newStartVNode.el, oldStartVNode.el);
          }
        }
        newStartVNode = newChildren[++newStartIdx];
      }
    }
    if (oldStartIdx > oldEndIdx) {
      const ref = newChildren[newEndIdx + 1];
      const refEl = isVElement(ref) ? ref.el : null;
      for (; newStartIdx <= newEndIdx; newStartIdx++) {
        const el = this.dom.createElement(newChildren[newStartIdx]);
        newChildren[newStartIdx].el = el;
        this.dom.insertBefore(parentEl, el, refEl);
      }
    } else if (newStartIdx > newEndIdx) {
      for (; oldStartIdx <= oldEndIdx; ++oldStartIdx) {
        const child = oldChildren[oldStartIdx];
        this.dom.removeVNode(child);
      }
    }
  }


  /**
   * 把newVNode的值同步到oldVNode
   * @param oldVNode
   * @param newVNode
   */

  patchVNode(oldVNode: VNode, newVNode: VNode) {
    let el = newVNode.el = oldVNode.el;
    if (oldVNode === newVNode) {
      return;
    }
    this.dom.updateElement(el, newVNode, oldVNode);
    if (isVText(oldVNode) && isVText(newVNode)) {
      return;
    }
    if (isVElement(oldVNode) && isVElement(newVNode)) {
      const oldChildren = oldVNode.children;
      const newChildren = newVNode.children;
      if (!isEmpty(oldChildren) && !isEmpty(newChildren) && oldChildren !== newChildren) {
        this.updateChildren(el, oldChildren, newChildren);
      } else if (!isEmpty(newChildren)) {
        newChildren.forEach(value => this.dom.appendChild(el, this.dom.createElement(value)))
      } else if (!isEmpty(oldChildren)) {
        this.dom.removeChildren(el);
      }
    }
  }


  patch(oldVNode: VElement, newVNode: VElement) {
    if (this.sameVNode(oldVNode, newVNode)) {
      this.patchVNode(oldVNode, newVNode);
    } else {
      const oldEl = oldVNode.el; // 当前oldVnode对应的真实元素节点
      let parentEl = oldEl.parentNode;  // 父元素
      newVNode.el = this.dom.createElement(newVNode);  // 根据Vnode生成新元素
      this.dom.insertBefore(parentEl, newVNode.el, oldEl);
      this.dom.removeChild(parentEl, oldEl); // 将新元素添加进父元素
    }
  }
}
