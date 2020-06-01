import { Component, Type, VNode } from '../../mvvm';
import { createVNode, isVNode } from '../../mvvm/v-node';
import './index.less'
import { ComponentProps } from '../../mvvm/component';

export interface ModalComponentProps<T extends Component> extends ComponentProps {
  content: Type<T>,
  width: string;
  contentProps: any;
}

export class ModalComponent<T extends Component> extends Component {
  content: Type<T> | (() => VNode);
  style: string;
  contentProps: Partial<T>;

  maskCloseable: boolean;
  title: VNode | string = '标题';

  buttons: VNode | VNode[];
  onCancel: () => void;
  onOk: () => void;

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

  readonly closeClick = () => {
    this.dom.removeChild(this.el, this.vNode.el);
  }

  render() {

    const Title = () => {
      if (typeof this.title  === 'string') {
        return  (
          <div class="bgx-modal-title">
            <span class="bgx-modal-title-text">{this.title}</span>
            <i class="topsales tps-icon-close bgx-modal-close" onclick={this.closeClick}/>
          </div>
        );
      } else if(isVNode(this.title)) {
        return this.title;
      }
      return <div/>
    };
    const Content = this.content;
    if (Content == null) {
      debugger
    }
    const Buttons = () => {
      return (
        <div class="bgx-modal-buttons">
          <button class="btn btn-default" type="button" onclick={this.onCancel}>取消</button>
          <button class="btn btn-primary" type="button" onclick={this.onOk}>确定</button>
        </div>
      );
    };
    return (
      <div ref="modal" class="bgx-modal" onclick={this.maskClick}>
        <div class="bgx-modal-wrapper" style={this.style}>
          { Title && <Title /> }
          { Content && <Content {...this.contentProps} /> }
          { Buttons && <Buttons/>}
        </div>
      </div>

    );
  }
}


