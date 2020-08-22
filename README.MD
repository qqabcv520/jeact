# jeact
![GitHub](https://img.shields.io/github/license/mashape/apistatus.svg)

在JQuery环境下用MVVM开发复杂组件，仅几kb超小体积。

定义一个switch组件，挂载到jquery后，`$('#el').switch()`就可以将#el变成一个开关组件，并且`$('#el').val()`就能获取值(js也能取)，放进form也能直接提交，专门解决老旧jquery项目维护难的问题。


## 支持环境

| Edge | Firefox | Chrome |
| --- | --- | --- |
| last 2 versions | last 2 versions | last 2 versions |

## 安装

npm
```shell script
npm i jeact --save
```
yarn
```shell script
yarn add jeact
```
或者直接引入
```html
<script src="https://qqabcv520.github.io/jeact/js/jeact.iife.js"></script>
```


## 使用


[在线演示](https://qqabcv520.github.io/jeact/) 

定义一个表单组件并挂载到jquery

```jsx
import { ValueComponent, createVNode } from 'jeact';
// 定义组件
class SwitchComponent extends ValueComponent {

  // xxx

  render () {
    return (
      <div >
        {/*xxx*/}
      </div>
    );
  }
}
// 挂载到jquery，名称为customSwitch
mountComponent({
  name: 'customSwitch',
  componentType: SwitchComponent,
})
```

直接在HTML中使用刚刚挂载的`customSwitch`组件，初始值为`true`
```html
<input custom-switch value="true" />
```

使用jquery初始化`customSwitch`组件

```html
<input id="switchInput" value="true" />
```
```js
$('#switchInput').customSwitch(); // 初始化组件
$('#switchInput').customSwitch('setOpen', true) // 调用组件方法，设置open为true
$('#switchInput').on('change', function() { // 监听事件
  console.log($(this).val());
})
```

完整用法看[这里](https://github.com/qqabcv520/jeact/blob/master/packages/jeact/README.MD)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2018-present, Fanzica
