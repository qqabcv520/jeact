import $ from 'jquery';



// 挂载为jquery插件
import { PMSelectorComponent, PMSelectorOption } from './pm-selector';
import { Component } from './mvvm';

$.fn.pmSelector = function (...args: any[]) {

  if (typeof args[0] === 'string') {
    const [methodName, ...methodArgs] = args;
    const component = this.data('pmSelector');
    if (!component) {
      $.error('节点不是一个 jQuery.pmSelector 组件');
    }
    const method = component[methodName];
    if (!method) {
      $.error('方法 ' + methodName + ' 不存在于 jQuery.pmSelector');
      return this;
    }
    component[methodName](...methodArgs);
  } else if (args[0] == null || typeof args[0] === 'object') {
    const methodArgs = args[0];
    const component = Component.create(PMSelectorComponent, {
      options: [],
      placeholder: methodArgs.placeholder,
      valueChange: (value: PMSelectorOption[]) => {
        this.val(value.map(value1 => value1.value).join(','));
      }
    });
    this.after(component.refs.selector);
    this.hide();
    this.data('pmSelector', component);
    $.get(methodArgs.url, (res) => {
      if (res && res.success) {
        component['options'] = transform(res.result, methodArgs.valueField, methodArgs.labelField, methodArgs.childrenField, methodArgs.value)
      }
    })
  } else {
    $.error('第一个参数只能是string或object');
  }
  return this;
};


function transform(option: any[], valueField = 'value', labelField = 'label', childrenField = 'children', values?: any[]) {
  return option.map(value => {
    return {
      value: value[valueField],
      label: value[labelField],
      checked: values.indexOf(String(value[valueField])) !== -1,
      children: transform(value[childrenField] || [], valueField, labelField, childrenField, values)
    }
  })
}

$(function () {
  const $pmSelector = $('[pm-selector]');
  const url = $pmSelector.attr('ps-url');
  const valueField = $pmSelector.attr('ps-value-field');
  const labelField = $pmSelector.attr('ps-label-field');
  const childrenField = $pmSelector.attr('ps-children-field');
  const placeholder = $pmSelector.attr('ps-placeholder');
  const val = $pmSelector.val();
  const value = val ? val.split(',') : [];
  $pmSelector.pmSelector({url, valueField, labelField, childrenField, placeholder, value});
});
