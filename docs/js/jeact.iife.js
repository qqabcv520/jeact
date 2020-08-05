var Jeact = (function (exports) {
  'use strict';

  class VNode {
  }
  class VElement extends VNode {
      constructor(type, attributes = {}, handles = {}, children = []) {
          super();
          this.type = type;
          this.attributes = attributes;
          this.handles = handles;
          this.children = children;
      }
  }
  class VText extends VNode {
      constructor(content) {
          super();
          this.content = String(content || content === 0 ? content : '');
      }
  }
  function createVNode(type, props, ...children) {
      let handle = {};
      let attribute = {};
      if (props) {
          handle = Object.keys(props).filter(value => value.startsWith('on')).reduce((pre, curr) => {
              pre[curr] = props[curr];
              return pre;
          }, {});
          attribute = Object.keys(props).filter(value => !value.startsWith('on')).reduce((pre, curr) => {
              pre[curr] = props[curr];
              return pre;
          }, {});
      }
      const vNodeChildren = children.flat(2).map(value => {
          return isVElement(value) ? value : new VText(value);
      });
      return new VElement(type, attribute, handle, vNodeChildren);
  }
  function isVNode(vNode) {
      return vNode instanceof VNode;
  }
  function isVElement(vNode) {
      return vNode && vNode.type != null;
  }
  function isVText(vNode) {
      return vNode && vNode.content !== undefined;
  }
  function isVDom(vNode) {
      return isVElement(vNode) && typeof vNode.type === 'string';
  }
  function isVComponent(vNode) {
      return isVElement(vNode) && typeof vNode.type === 'function' && vNode.type.prototype && vNode.type.prototype.render;
  }
  function isVFunction(vNode) {
      return isVElement(vNode) && typeof vNode.type === 'function' && !(vNode.type.prototype && vNode.type.prototype.render);
  }

  class DomOperate {
      constructor(context) {
          this.context = context;
      }
      createElement(vNode, rootUpdate) {
          var _a, _b, _c;
          if (isVComponent(vNode)) {
              vNode.component = Component.create(vNode.type, Object.assign(Object.assign(Object.assign({}, vNode.attributes), vNode.handles), { children: vNode.children, rootUpdate }));
              vNode.el = (_a = vNode.component.vNode) === null || _a === void 0 ? void 0 : _a.el;
              Object.keys(vNode.attributes).forEach(key => {
                  const value = vNode.attributes[key];
                  this.setAttribute(vNode.component, key, value);
              });
              return vNode.el;
          }
          else if (isVFunction(vNode)) {
              vNode.component = Component.create(FunctionComponent, {
                  renderFunction: vNode.type,
                  functionProps: Object.assign(Object.assign(Object.assign({}, vNode.attributes), vNode.handles), { children: vNode.children }),
                  rootUpdate,
              });
              vNode.el = (_b = vNode.component.vNode) === null || _b === void 0 ? void 0 : _b.el;
              return vNode.el;
          }
          else if (isVDom(vNode)) {
              const el = document.createElement(vNode.type);
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
              (_c = vNode.children) === null || _c === void 0 ? void 0 : _c.forEach(value => {
                  const node = this.createElement(value, rootUpdate);
                  if (node) {
                      el.appendChild(node);
                  }
              });
              return el;
          }
          else if (isVText(vNode)) {
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
      updateVDom(el, newVNode, oldVNode) {
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
                  }
                  else if (value && value !== 0) {
                      this.setAttribute(el, key, value, oldValue);
                  }
                  else {
                      this.removeAttribute(el, key, oldValue);
                  }
              });
          }
          else if (isVText(newVNode) && isVText(oldVNode) && newVNode.content !== oldVNode.content) {
              newVNode.el.data = newVNode.content;
          }
      }
      updateVText(el, newVNode, oldVNode) {
          if (newVNode.content !== oldVNode.content) {
              newVNode.el.data = newVNode.content;
          }
      }
      setAttribute(el, attrName, attrValue, oldValue = {}) {
          if (el instanceof HTMLInputElement && el.type === 'checkbox' && attrName === 'checked') {
              el['checked'] = attrValue;
              return;
          }
          if (el instanceof HTMLInputElement && attrName === 'value') {
              el['value'] = attrValue;
              return;
          }
          if (el instanceof HTMLElement && attrName === 'dangerouslySetInnerHTML') {
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
                  }
                  else if (value && value !== 0) {
                      el.style[key] = value;
                  }
                  else {
                      el.style[key] = '';
                  }
              });
              return;
          }
          if (attrName === 'ref') {
              this.context.refs[attrValue] = el;
          }
          if (el instanceof HTMLElement && attrValue != null) {
              if (attrValue === true) {
                  el.setAttribute(attrName, '');
              }
              else if (attrValue === false) {
                  el.removeAttribute(attrName);
              }
              else {
                  el.setAttribute(attrName, String(attrValue));
              }
          }
      }
      removeAttribute(el, attrName, oldValue = {}) {
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
      removeChildren(el) {
          const children = el.childNodes;
          for (let i = children.length - 1; i >= 0; i--) {
              this.removeChild(el, children[i]);
          }
      }
      appendChild(parentNode, childNode) {
          parentNode.appendChild(childNode);
      }
      removeChild(parentNode, childNode) {
          parentNode.removeChild(childNode);
      }
      insertBefore(parentNode, newNode, referenceNode) {
          parentNode.insertBefore(newNode, referenceNode);
      }
      parentNode(node) {
          return node.parentNode;
      }
      nextSibling(node) {
          return node.nextSibling;
      }
      removeVNode(vNode) {
          if (isVComponent(vNode) || isVFunction(vNode)) {
              this.callDestroy(vNode);
          }
          const pNode = this.parentNode(vNode.el);
          if (pNode) {
              this.removeChild(pNode, vNode.el);
          }
      }
      // 递归销毁所有子节点
      callDestroy(vnode) {
          var _a, _b;
          if (isVElement(vnode)) {
              for (let i = 0; i < vnode.children.length; ++i) {
                  this.callDestroy(vnode.children[i]);
              }
          }
          if (isVComponent(vnode)) {
              if ((_a = vnode.component) === null || _a === void 0 ? void 0 : _a.vNode) {
                  this.callDestroy((_b = vnode.component) === null || _b === void 0 ? void 0 : _b.vNode);
                  vnode.component.destroy();
              }
          }
      }
  }

  class Differentiator {
      constructor(dom) {
          this.dom = dom;
      }
      /**
       * 判断input是否有相同的type
       * @param a
       * @param b
       */
      sameInputType(a, b) {
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
      sameVNode(a, b) {
          if (isVDom(a) && isVDom(b)) {
              return (a.key === b.key &&
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
      createIndexMap(children, beginIdx, endIdx) {
          let i, key;
          const map = new Map();
          for (i = beginIdx; i <= endIdx; ++i) {
              key = children[i].key;
              if (key != null) {
                  map.set(key, i);
              }
          }
          return map;
      }
      findVNodeIndex(vNodes, targetNode, start, end) {
          for (let i = start; i < end; i++) {
              const currVNode = vNodes[i];
              if (currVNode != null && this.sameVNode(targetNode, currVNode)) {
                  return i;
              }
          }
          return null;
      }
      updateChildren(parentEl, oldChildren, newChildren, rootUpdate) {
          let oldStartIdx = 0;
          let oldStartVNode = oldChildren[0];
          let newStartIdx = 0;
          let newStartVNode = newChildren[0];
          let oldEndIdx = oldChildren.length - 1;
          let oldEndVNode = oldChildren[oldEndIdx];
          let newEndIdx = newChildren.length - 1;
          let newEndVNode = newChildren[newEndIdx];
          let oldKeyToIdx;
          let idxInOld;
          let vNodeToMove;
          while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
              if (oldStartVNode == null) { // 对于vnode.key的比较，会把oldVnode = null
                  oldStartVNode = oldChildren[++oldStartIdx];
              }
              else if (oldEndVNode == null) {
                  oldEndVNode = oldChildren[--oldEndIdx];
              }
              else if (this.sameVNode(oldStartVNode, newStartVNode)) {
                  this.patchVNode(oldStartVNode, newStartVNode);
                  oldStartVNode = oldChildren[++oldStartIdx];
                  newStartVNode = newChildren[++newStartIdx];
              }
              else if (this.sameVNode(oldEndVNode, newEndVNode)) {
                  this.patchVNode(oldEndVNode, newEndVNode);
                  oldEndVNode = oldChildren[--oldEndIdx];
                  newEndVNode = newChildren[--newEndIdx];
              }
              else if (this.sameVNode(oldStartVNode, newEndVNode)) { // VNode 右移
                  this.patchVNode(oldStartVNode, newEndVNode);
                  this.dom.insertBefore(parentEl, oldStartVNode.el, this.dom.nextSibling(newEndVNode.el));
                  oldStartVNode = oldChildren[++oldStartIdx];
                  newEndVNode = newChildren[--newEndIdx];
              }
              else if (this.sameVNode(oldEndVNode, newStartVNode)) { // VNode 左移
                  this.patchVNode(oldEndVNode, newStartVNode);
                  this.dom.insertBefore(parentEl, oldEndVNode.el, newStartVNode.el);
                  oldEndVNode = oldChildren[--oldEndIdx];
                  newStartVNode = newChildren[++newStartIdx];
              }
              else {
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
                  }
                  else {
                      vNodeToMove = oldChildren[idxInOld];
                      if (this.sameVNode(vNodeToMove, newStartVNode)) {
                          this.patchVNode(vNodeToMove, newStartVNode);
                          oldChildren[idxInOld] = undefined;
                          this.dom.insertBefore(parentEl, vNodeToMove.el, oldStartVNode.el);
                      }
                      else {
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
          }
          else if (newStartIdx > newEndIdx) {
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
      patchVNode(oldVNode, newVNode, rootUpdate) {
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
              }
              else if (!isEmpty(newChildren)) {
                  newChildren.forEach(value => this.dom.appendChild(el, this.dom.createElement(value, rootUpdate)));
              }
              else if (!isEmpty(oldChildren)) {
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
              newVNode.component.functionProps = Object.assign(Object.assign(Object.assign({}, newVNode.attributes), newVNode.handles), { children: newVNode.children });
              const v = oldVNode.component.runDiff();
              oldVNode.el = v && v.el;
              return;
          }
      }
      patch(oldVNode, newVNode, rootUpdate) {
          if (this.sameVNode(oldVNode, newVNode)) {
              this.patchVNode(oldVNode, newVNode);
          }
          else {
              const oldEl = oldVNode.el; // 当前oldVnode对应的真实元素节点
              const parentEl = oldEl.parentNode; // 父元素
              newVNode.el = this.dom.createElement(newVNode, rootUpdate); // 根据Vnode生成新元素
              this.dom.insertBefore(parentEl, newVNode.el, oldEl);
              this.dom.removeChild(parentEl, oldEl); // 将新元素添加进父元素
          }
      }
  }

  class Component {
      constructor(args) {
          this.updateFlag = false;
          this.dom = new DomOperate(this);
          this.diff = new Differentiator(this.dom);
          this.refs = {};
          if (args) {
              Object.assign(this, args);
          }
      }
      static create(componentType, props, el) {
          const dom = typeof el === 'string' ? document.querySelector(el) : el;
          const component = new componentType(Object.assign({}, props));
          component.el = dom;
          component.beforeMount();
          component.mount();
          component.mounted();
          return component;
      }
      mount() {
          this.vNode = this.render();
          const node = this.dom.createElement(this.vNode, this.update.bind(this));
          this.appendToEl(node);
      }
      appendToEl(node) {
          if (this.el && node) {
              this.dom.appendChild(this.el, node);
          }
      }
      reappendToEl(oldNode, newNode) {
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
      render() {
          return null;
      }
  }
  class ValueComponent extends Component {
      constructor(props) {
          super(props);
          this.valueChange = props.valueChange;
      }
      mount() {
          if (this.el) {
              this.writeValue(this.el.value);
          }
          super.mount();
      }
      readValue(value) {
          return value != null ? String(value) : '';
      }
      onChange(value) {
          if (this.valueChange) {
              this.valueChange(value);
          }
          if (this.el) {
              this.el.value = this.readValue(value);
              this.el.dispatchEvent(new InputEvent('input'));
              this.el.dispatchEvent(new UIEvent('change'));
          }
      }
      appendToEl(node) {
          const parentNode = this.el && this.dom.parentNode(this.el);
          if (parentNode && node) {
              this.dom.insertBefore(parentNode, node, this.el);
              this.el.hidden = true;
          }
      }
  }
  class FunctionComponent extends Component {
      render() {
          return this.renderFunction(this.functionProps);
      }
  }

  // 判空
  function isEmpty(value) {
      return value == null || value.length === 0;
  }
  // 驼峰/下划线 转 短横线命名(kebab-case)
  function getKebabCase(str) {
      const reg = /^([A-Z$]+)/g;
      const reg2 = /_([a-zA-Z$]+)/g;
      const reg3 = /([A-Z$]+)/g;
      return str.replace(reg, ($, $1) => $1.toLowerCase())
          .replace(reg2, ($, $1) => '-' + $1.toLowerCase())
          .replace(reg3, ($, $1) => '-' + $1.toLowerCase());
  }
  // 挂载为jquery插件
  function mountComponent({ name, componentType, props, $ = window['jQuery'] }) {
      if ($ == null) {
          return;
      }
      $.fn[name] = function (...args) {
          if (typeof args[0] === 'string') {
              const [propName, ...methodArgs] = args;
              const component = this.data(name);
              if (!component) {
                  $.error(`节点不是一个 ${name} 组件`);
              }
              if (typeof component[propName] === 'function') {
                  component[propName](...methodArgs);
              }
              else if (methodArgs != null && methodArgs.length === 1) {
                  return component[propName] = methodArgs[0];
              }
              else {
                  return component[propName];
              }
          }
          else if (args[0] == null || typeof args[0] === 'object') {
              const methodArgs = args[0];
              const component = Component.create(componentType, methodArgs, this[0]);
              this.data(name, component);
          }
          else {
              $.error('第一个参数只能是string或object');
          }
          return this;
      };
      $(function () {
          $(`[${getKebabCase(name)}]`).each(function () {
              const $selected = $(this);
              const propsValue = (props || []).reduce((pre, curr) => {
                  pre[curr] = $selected.attr(getKebabCase(curr));
                  return pre;
              }, {});
              $selected[name](propsValue);
          });
      });
  }

  exports.Component = Component;
  exports.FunctionComponent = FunctionComponent;
  exports.VElement = VElement;
  exports.VNode = VNode;
  exports.VText = VText;
  exports.ValueComponent = ValueComponent;
  exports.createVNode = createVNode;
  exports.getKebabCase = getKebabCase;
  exports.isEmpty = isEmpty;
  exports.isVComponent = isVComponent;
  exports.isVDom = isVDom;
  exports.isVElement = isVElement;
  exports.isVFunction = isVFunction;
  exports.isVNode = isVNode;
  exports.isVText = isVText;
  exports.mountComponent = mountComponent;

  return exports;

}({}));
//# sourceMappingURL=jeact.iife.js.map
