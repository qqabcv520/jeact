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

js创建组件

```js

// 定义functional组件
function Counter({count}) {
  return el('span', {},
    el('span', {}, ' 点击了：'),
    el('span', {}, count),
    el('span', {}, '次')
  )
}

// 定义class组件
class TestComponent extends Component {
  constructor (props) {
    super(props);
    this.count = 0;
  }
  buttonClick = () => {
    this.count++;
    this.update();
  }
  render () {
    return el('div', {},
      el('button', {onclick: this.buttonClick}, '按钮'),
      el(Counter, {count: this.count}),
    )
  }
}

// 挂载到ID为el的节点上
const vm = Component.create(TestComponent, {}, '#el')
```

jsx创建组件

```jsx
import { Component, createVNode } from 'jeact';

class TestComponent extends Component {
  constructor (props) {
    super(props);
    this.count = 0;
  }
  buttonClick = () => {
    this.count++;
    this.update();
  }
  render () {
    return (
      <div>
        <button onClick={this.buttonClick}>按钮</button>
        <Counter count={this.count} />
      </div>
    )
  }
}
```

定义一个表单组件并挂载到jquery

```jsx
import { ValueComponent, createVNode } from 'jeact';

class SwitchComponent extends ValueComponent {

  constructor (props) {
    super(props);
    this.open = false;
  }

  setOpen(val) {
    this.open = val;
    this.onChange(this.open);
    this.update(); // 当data变化之后，需要调用update方法，将该组件加到更新队列中
  }
  // 必须实现这个抽象方法，用于将input的value和组件的vm绑定
  writeValue(value) {
    this.open = value && value !== 'false';
  }

  buttonClick = () => {
    this.setOpen(!this.open);
  }
  render () {
    const switchWrapperStyle = {
      userSelect: 'none',
      cursor: 'pointer',
      border: '1px solid #ccc',
      display: 'inline-block',
      borderRadius: '10px',
      height: '20px',
      width: '35px',
    }
    const switchHandlerStyle = {
      width: '20px',
      height: '100%',
      backgroundColor: '#3587ff',
      borderRadius: '10px',
      transition: 'margin 0.15s, background-color 0.3s'
    }
    if (this.open) {
      switchHandlerStyle.marginLeft = '15px';
      switchHandlerStyle.backgroundColor = '#3587ff';
    } else {
      switchHandlerStyle.marginLeft = '0';
      switchHandlerStyle.backgroundColor = '#999';
    }
    return (
      <div style={switchWrapperStyle} onClick={this.buttonClick} >
        <div style={switchHandlerStyle} />
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

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2018-present, Fanzica
