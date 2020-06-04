import { Component } from '../../mvvm';
import { createVNode } from '../../mvvm/v-node';
import './index.less'
import { mountModal } from '../../utils';
import classname from 'classname';
import Sortable from 'sortablejs';
import { ModalComponent } from '../modal';


// $.pictureSelector({
//   code: 'SKU123456',
//   pics: [], // 已经被选中的图片
//   onOk: function (pics) {
//     console.log(pics); // 图片url数组
//   },
//   onCancel: function() {
//     // 取消选择
//   }
// });

interface ImageInfo {
  mainImgUrl: string;
  width?: number;
  height?: number;
  type?: string;
}

export class PictureSelectorComponent extends Component {

  imageList: ImageInfo[] = [{
    mainImgUrl: 'http://img.sellercube.com/imgsgroup1/M00/1F/BB/rB9kfVsEzc2AGmZaAArXs6cPcgE36.jpeg',
    width: 100,
    height: 100,
    type: 'jpg'
  },{
    mainImgUrl: 'http://img.sellercube.com/Uploadfile/6/SKU078081/20130704195551555.JPG',
    width: 100,
    height: 100,
    type: 'jpg'
  },{
    mainImgUrl: 'http://img.sellercube.com/Uploadfile/6/SKU078081/20130704195552803.JPG',
    width: 100,
    height: 100,
    type: 'jpg'
  },];

  code = '';
  bgxMaxImageNum = 10;
  poaList: { value: string, label: string }[] = [{value: 'POA123456', label: 'POA123456'}];
  pics: string[];

  private selectedImg: ImageInfo[] = [];


  get displayImgs(): ImageInfo[] {
    return this.imageList;
  }

  getImageInfos(images: ImageInfo[]) {
    return Promise.all(images.map(images => this.getImgInfo(images)));
  }

  getImgInfo(image: ImageInfo): Promise<ImageInfo> {
    const newImage: ImageInfo = {...image};
    return new Promise<ImageInfo>((resolve, reject) => {
      const img = new Image();
      img.src = image.mainImgUrl;
      img.onerror = function (e) {
        resolve(newImage);
      };
      const arr = newImage.mainImgUrl.split('.');
      newImage.type = arr[arr.length - 1].toUpperCase();
      if (img.complete) {
        newImage.width = img.width;
        newImage.height = img.height;
        resolve(newImage);
      } else {
        img.onload = function () {
          newImage.width = img.width;
          newImage.height = img.height;
          img.onload = null; // 避免重复加载
          resolve(newImage);
        };
      }
    });
  }


  constructor(args) {
    super(args);
  }

  mounted() {
    super.mounted();

    const wrapper = this.refs.sortWrapper as HTMLElement;
    new Sortable(wrapper, {
      animation: 150,
      onUpdate: (event) => {
        const item = this.selectedImg.splice(event.oldIndex, 1)[0];
        this.selectedImg.splice(event.newIndex, 0, item);
      }
    });
  }

  selectAll = e => {
    const num = this.bgxMaxImageNum - this.selectedImg.length;
    const unselectedImg = this.displayImgs.filter(value => !this.isSelected(value));
    const newImgs = unselectedImg.slice(0, num);
    this.selectedImg = this.selectedImg.concat(newImgs);
    this.update();
  };

  isSelected = (item: ImageInfo) => {
    return this.selectedImg && this.selectedImg.some(val => val.mainImgUrl === (item && item.mainImgUrl));
  }

  private clickImg(item: ImageInfo) {
    if (this.isSelected(item)) {
      this.removeImg(item);
    } else {
      this.selectImg(item);
    }
    this.update();
  }


  selectImg(item: ImageInfo) {
    if (this.selectedImg.length >= this.bgxMaxImageNum) {
      // this.msg.info(`最多选择${this.bgxMaxImageNum}张图片！`);
      return;
    }
    this.selectedImg = [...this.selectedImg, item];
  }

  removeImg(item: ImageInfo) {
    const index = this.selectedImg.findIndex(val => val.mainImgUrl === item.mainImgUrl);
    this.selectedImg.splice(index, 1);
    this.selectedImg = [...this.selectedImg];
    this.update();
  }

  preview(item: ImageInfo) {
    console.log(item);
    Component.create(ModalComponent, {
      title: '预览图片',
      content: () => {
        return (
          <div style="background: #fff; min-height: 600px;">
            <img src={item.mainImgUrl} alt="" style="width: 100%"/>
          </div>
        )
      },
      maskCloseable: true,
      style: 'width: 1000px;',
      buttons: null,
    }, document.body);
    this.update();
  }

  private codeChange(value: any) {
    this.code = value;
    $.ajax('http://192.168.1.146:8783/saleslister/product/getProductImageBySkuOrPoa', {
      success: async (res) => {
        this.imageList = await this.getImageInfos(res.result)
      },
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        platformNo: 0,
        skuOrPoa: value
      }),
    });
  }



  render() {

    const SelectedImg = ({item}: {item: ImageInfo}) => {
      return (
        <div class="bgx-pic-selected-option-wrapper" >
          <img src={item.mainImgUrl} class="bgx-pic-selected-img"/>
          <div class="bgx-pic-selected-operation">
            <i class="topsales tps-status-error bgx-pic-selected-close" onclick={() => this.removeImg(item)} title="取消选择" />
            <i class="topsales tps-icon-See bgx-pic-selected-icon" onclick={() => this.preview(item)} title="查看大图" />
          </div>
        </div>
      )
    }

    const DisplayImg = ({item}: {item: ImageInfo}) => {
      return (
        <div onclick={() => this.clickImg(item)}
             class={classname(['bgx-pic-images-option', {'bgx-pic-images-option-selected': this.isSelected(item)}])}>
          <div class="bgx-pic-images-option-wrapper" contextmenu="contextMenu($event, menu, index)">
            <img src={item.mainImgUrl} class="bgx-pic-images-option-img"/>
            <div class="bgx-pic-images-option-mask" >
              <i class={'topsales tps-status-correct bgx-pic-images-option-icon'} />
            </div>
          </div>
          <div>
            <span>{item.width + '*' + item.height + ' ' + item.type}</span>
          </div>
        </div>
      )
    }

    return (
      <div class="bgx-picture-selector">
        <div class="bgx-pic-selected-images" ref="sortWrapper">
          { this.selectedImg.map(item => <SelectedImg item={item}/>) }
        </div>
        <div class="bgx-pic-selector-content">
          <div class="bgx-pic-toolbar">
            <input class="form-control bgx-pic-toolbar-input" placeholder="搜索SKU/POA" value={this.code}
                   onChange={e => this.codeChange(e.target.value)}/>
            <select class="form-control bgx-pic-toolbar-input" ngModel="poaFilter" placeholder="过滤POA图片"
                    ngModelChange="loadImage($event)">
              {this.poaList.map(value => <option value={value.value}>{value.label}</option>)}
            </select>
            <select class="form-control bgx-pic-toolbar-input" ngModel="poaFilter" placeholder="图片类型"
                    ngModelChange="loadImage($event)">
              <option  value={1}>{''}</option>
            </select>
            <select class="form-control bgx-pic-toolbar-input" ngModel="poaFilter" placeholder="平台"
                    ngModelChange="loadImage($event)">
              <option  value={1}>{''}</option>
            </select>
            <div class="bgx-pic-toolbar-space"/>
            <button class="btn btn-default toolbar-select-all" onclick={this.selectAll}>全选</button>
          </div>
          <div class="bgx-pic-images">
            { this.displayImgs.map(item => <DisplayImg item={item}/>) }
          </div>
        </div>
      </div>
    );
  }
}


// 挂载为jquery插件
mountModal({
  name: 'pictureSelector',
  title: '图片选择',
  content: PictureSelectorComponent,
  style: 'width: 1000px;',
});
