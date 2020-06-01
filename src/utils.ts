import { Component, Type } from './mvvm';
import JQuery from 'jquery';
import { ModalComponent } from '.';

// 判空
export function isEmpty(value: any) {
  return value == null || value.length === 0;
}

// 驼峰/下划线 转 短横线命名(kebab-case)
export function getKebabCase(str: string): string {
  const reg = /^([A-Z$]+)/g;
  const reg2 = /_([a-zA-Z$]+)/g;
  const reg3 = /([A-Z$]+)/g;
  return str.replace(reg, ($, $1) => $1.toLowerCase())
    .replace(reg2, ($, $1) => '-' + $1.toLowerCase())
    .replace(reg3, ($, $1) => '-' + $1.toLowerCase());
}

export interface mountComponentArgs {
  name: string;
  componentType: Type<Component>;
  props: string[];
  $?: JQueryStatic;
}

// 挂载为jquery插件
export function mountComponent ({name, componentType, props, $ = JQuery}: mountComponentArgs) {
  if ($ == null) {
    return;
  }
  $.fn[name] = function (...args: any[]) {

    if (typeof args[0] === 'string') {
      const [propName, ...methodArgs] = args;
      const component = this.data(name);
      if (!component) {
        $.error(`节点不是一个 ${name} 组件`);
      }
      if (typeof component[propName] === 'function') {
        component[propName](...methodArgs);
      } else if (methodArgs != null && methodArgs.length === 1) {
        return component[propName] = methodArgs[0];
      } else {
        return component[propName];
      }
    } else if (args[0] == null || typeof args[0] === 'object') {
      const methodArgs = args[0];
      const component = Component.create(componentType, methodArgs, this[0]);
      this.data(name, component);
    } else {
      $.error('第一个参数只能是string或object');
    }
    return this;
  };

  $(function () {
    $(`[${getKebabCase(name)}]`).each(function (this) {
      const $selected = $(this);
      const propsValue = props.reduce((pre, curr) => {
        pre[curr] = $selected.attr(getKebabCase(curr));
        return pre;
      }, {})
      $selected[name](propsValue);
    })
  });

}

export interface MountModalArgs<T extends Component> extends Partial<ModalComponent<T>>{
  name: string;
  title: string
  $?: JQueryStatic;
}

export function mountModal<T extends Component>(args: MountModalArgs<T>) {
  const {
    name,
    $ = JQuery,
    ...restProp
  } = args;
  $[name] = function(contentProps: Partial<T>) {
    return Component.create<ModalComponent<T>>(ModalComponent, {
      ...restProp,
      ...contentProps,
    }, document.body);
  }

}
