import './index.less';
import { Component, Type, VNode, isVNode, createVNode, ComponentProps } from 'jeact';

export interface ModalComponentProps<T extends Component> extends ComponentProps {
  content: Type<T>;
  width: string;
  contentProps: any;
}

export class ModalComponent<T extends Component = any> extends Component {
  content: Type<T> | (() => VNode);
  style: string;
  contentProps: Partial<T>;

  maskCloseable: boolean;
  title: VNode | string;

  buttons: VNode | VNode[];
  onCancel: (instance: T) => void;
  onOk: (instance: T) => Promise<boolean | void> | boolean | void;

  constructor(
    args: ModalComponentProps<Component>
  ) {
    super(args);
  }

  readonly maskClick = (e: any) => {
    if (e.target  === this.refs.modal && this.maskCloseable) {
      this.dom.removeChild(this.el, this.vNode.el);
    }
  }

  readonly cancelClick = () => {
    this.close();
  }

  readonly closeClick = () => {
    this.close();
  }

  readonly  onOkClick = async () => {
    if (this.onOk) {
      let result: boolean | void;
      try {
        result = await this.onOk(this.refs.instance as T);
      } catch (e) { }
      if (result !== false) {
        this.close();
      }
    }
  }

  close() {
    this.dom.removeChild(this.el, this.vNode.el);
    if (this.onCancel) {
      this.onCancel(this.refs.instance as T);
    }
  }

  render() {
    const Title = () => {
      if (typeof this.title  === 'string') {
        return  (
          <div class='bgx-modal-title'>
            <span class='bgx-modal-title-text'>{this.title || '未命名'}</span>
            <i class='fa fa-times bgx-modal-close' onclick={this.closeClick}/>
          </div>
        );
      } else if (isVNode(this.title)) {
        return this.title;
      }
    };
    const Content = this.content;
    const Buttons = () => {
      return this.buttons !== undefined ? this.buttons : (
        <div class='bgx-modal-buttons'>
          <button class='btn btn-default' type='button' onclick={this.cancelClick}>取消</button>
          <button class='btn btn-primary' type='button' onclick={this.onOkClick}>确定</button>
        </div>
      );
    };
    return (
      <div ref='modal' class='bgx-modal' onclick={this.maskClick}>
        <div class='bgx-modal-wrapper' style={this.style}>
          { Title && <Title /> }
          { Content && <Content ref='instance' {...this.contentProps} /> }
          { Buttons && <Buttons/>}
        </div>
      </div>
    );
  }
}


export function mountModal<T extends Component>(args: MountModalArgs<T>) {
  const {
    name,
    $ = jQuery,
    ...restProp
  } = args;
  $[name] = function(contentProps: Partial<T>) {
    return Component.create<ModalComponent<T>>(ModalComponent, {
      ...restProp,
      ...contentProps,
    }, document.body);
  };
}


export interface MountModalArgs<T extends Component> extends Partial<ModalComponent<T>> {
  name: string;
  title: string;
  $?: JQueryStatic;
}
