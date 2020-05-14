import { Component, Type } from './mvvm';


export function isEmpty(value: any) {
  return value == null || value.length === 0;
}



// 挂载为jquery插件
export function mountInput(
  {name, componentType, props, $ = window['JQuery']}: {name: string, componentType: Type<Component>, props: string[], $?: any}
) {
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
      const method = component[propName];
      if (!method) {
        $.error(`方法 ${propName} 不存在于 ${name}`);
        return this;
      }
      if (typeof component[propName] === 'function') {
        component[propName](...methodArgs);
      } else {
        return component[propName];
      }
    } else if (args[0] == null || typeof args[0] === 'object') {
      const methodArgs = args[0];
      const component = Component.create(componentType, {
        ...methodArgs,
        valueChange: (value: any[]) => {
          this.val(value == null ? '' : String(value));
        }
      });
      this.after(component['vNode'].el);
      this.hide();
      this.data(name, component);
    } else {
      $.error('第一个参数只能是string或object');
    }
    return this;
  };

  $(function () {
    $(name).each(function (this) {
      const $selected = $(this);
      props.reduce((pre, curr) => {
        pre[curr] = $selected.attr(curr);
        return pre;
      }, {})
      const val = $selected.val();
      const value = val ? val.split(',') : [];
      $selected.pmSelector({...props, value});
    })
  });

}


