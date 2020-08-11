import './index.less';
import classname from 'classname';
import Sortable from 'sortablejs';
import { ModalComponent, mountModal } from '../modal';
import { Component, createVNode } from 'jeact';

interface ImageInfo {
  url: string;
  width?: number;
  height?: number;
  type?: string;
  propertyCode?: string;
  platform?: string;
}

export class PictureSelectorComponent extends Component {

  imageList: ImageInfo[] = [];

  poaList: { code: string, label: string }[] = [];
  poaFilter: string;
  platformList: { value: string, label: string }[] = [];
  platformFilter: string;
  selectedImg: ImageInfo[] = [];


  bgxCode: string;
  bgxMaxImageNum: number;
  bgxMaxImageSize: number;
  bgxMinImageSize: number;
  bgxMustSquare: boolean;

  bgxLoadImageByCode: (code) => Promise<ImageInfo[]>;
  bgxOnOk: (imageList: string[]) => void;

  get displayImage() {
    return this.imageList
      .filter(value => (!this.poaFilter || value.propertyCode === this.poaFilter)
        && (!this.platformFilter || value.platform === this.platformFilter));
  }

  loadPoaList() {
    const poaList = [...new Set(this.imageList.map(value => value.propertyCode).filter(value => value))];
    return poaList.map(function (value) {
      return {
        code: value,
        label: value
      };
    });
  }

  loadPlatformList() {
    const platformList = [...new Set(this.imageList.map(value => value.platform).filter(value => value))];
    return platformList.map(function (value) {
      return {
        value: value,
        label: value
      };
    });
  }

  getImageInfos(images: ImageInfo[]) {
    return Promise.all(images.map(image => this.getImgInfo(image)));
  }

  getImgInfo(image: ImageInfo): Promise<ImageInfo> {
    const newImage: ImageInfo = {...image};
    return new Promise<ImageInfo>((resolve, reject) => {
      const img = new Image();
      img.src = image.url;
      img.onerror = function (e) {
        resolve(newImage);
      };
      const arr = newImage.url.split('.');
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
    // tslint:disable-next-line:no-unused-expression
    new Sortable(wrapper, {
      animation: 150,
      onUpdate: (event) => {
        const item = this.selectedImg.splice(event.oldIndex, 1)[0];
        this.selectedImg.splice(event.newIndex, 0, item);
        this.update();
      }
    });
    this.loadByCode();
  }

  async loadByCode() {
    if (this.bgxLoadImageByCode && this.bgxCode) {
      try {
        this.imageList = await this.bgxLoadImageByCode(this.bgxCode);
      } catch (e) {
        this.imageList = [];
      }
      this.update();
      this.poaList = this.loadPoaList();
      this.platformList = this.loadPlatformList();
      this.imageList = await this.getImageInfos(this.imageList);
      this.update();
    }
  }

  selectAll = e => {
    const num = this.bgxMaxImageNum != null ? this.bgxMaxImageNum - this.selectedImg.length : this.selectedImg.length;
    const unselectedImg = this.displayImage.filter(value => !this.isSelected(value) && this.sizeCheck(value));
    const newImgs = unselectedImg.slice(0, num);
    this.selectedImg = this.selectedImg.concat(newImgs);
    this.update();
  }

  isSelected = (item: ImageInfo) => {
    return this.selectedImg && this.selectedImg.some(val => val.url === (item && item.url));
  }

  private clickImg(item: ImageInfo) {
    if (this.isSelected(item)) {
      this.removeImg(item);
    } else if (this.sizeCheck(item)) {
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
    const index = this.selectedImg.findIndex(val => val.url === item.url);
    this.selectedImg.splice(index, 1);
    this.selectedImg = [...this.selectedImg];
    this.update();
  }

  preview(item: ImageInfo) {
    Component.create<ModalComponent>(ModalComponent, {
      title: '预览图片',
      content: () => {
        return (
          <div style='background: #fff; min-height: 600px;'>
            <img src={item.url} alt='' style='width: 100%'/>
          </div>
        );
      },
      maskCloseable: true,
      style: 'width: 1000px;',
      buttons: null,
    }, document.body);
    this.update();
  }

  async codeChange(value: any) {
    console.log(value);
    this.bgxCode = value;
    this.loadByCode();
  }

  poaFilterChange() {
    const that = this;
    return function (this: HTMLSelectElement) {
      that.poaFilter = this.value;
      that.loadByCode();
    };
  }

  platformFilterChange() {
    const that = this;
    return function (this: HTMLSelectElement) {
      that.platformFilter = this.value;
      that.loadByCode();
    };
  }

  render() {

    const SelectedImg = ({item}: {item: ImageInfo}) => {
      return (
        <div class='bgx-pic-selected-option-wrapper' >
          <img src={item.url} class='bgx-pic-selected-img'/>
          <div class='bgx-pic-selected-operation'>
            <i class='fa fa-times-circle bgx-pic-selected-close' onclick={() => this.removeImg(item)} title='取消选择' />
            <i class='fa fa-search-plus bgx-pic-selected-icon' onclick={() => this.preview(item)} title='查看大图' />
          </div>
        </div>
      );
    };

    const DisplayImg = ({item}: {item: ImageInfo}) => {
      return (
        <div onclick={() => this.clickImg(item)}
             class={classname(['bgx-pic-images-option', {'bgx-pic-images-option-selected': this.isSelected(item)}])}>
          <div class='bgx-pic-images-option-wrapper'>
            <img src={item.url} class='bgx-pic-images-option-img'/>
            <div class='bgx-pic-images-option-mask' >
              <i class={'fa fa-check-circle-o bgx-pic-images-option-icon'} />
            </div>
          </div>
          <div>
            <span>{item.width}*{item.height} {item.type}</span>
          </div>
        </div>
      );
    };

    return (
      <div class='bgx-picture-selector'>
        <div class='bgx-pic-selected-images' ref='sortWrapper'>
          { this.selectedImg.map(item => <SelectedImg item={item}/>) }
        </div>
        <div class='bgx-pic-selector-content'>
          <div class='bgx-pic-toolbar'>
            <input class='form-control bgx-pic-toolbar-input' placeholder='搜索SKU/POA' value={this.bgxCode}
                   onChange={e => this.codeChange(e.target.value)}
                   onkeydown={e => e.key === 'Enter' && this.codeChange(e.target.value)}/>
            <select class='form-control bgx-pic-toolbar-input' value={this.poaFilter} placeholder='过滤POA图片'
                    onchange={this.poaFilterChange()}>
              <option value=''>所有POA</option>
              {this.poaList.map(value => <option value={value.code}>{value.label || value.code}</option>)}
            </select>
            {/*<select class='form-control bgx-pic-toolbar-input' ngModel='poaFilter' placeholder='图片类型'*/}
            {/*        ngModelChange='loadImage($event)'>*/}
            {/*  <option  value={1}>{''}</option>*/}
            {/*</select>*/}
            <select class='form-control bgx-pic-toolbar-input' value={this.poaFilter} placeholder='平台'
                    onchange={this.platformFilterChange()}>
              <option value=''>所有平台</option>
              {this.platformList.map(value => <option value={value.value}>{value.label || value.value}</option>)}
            </select>
            <div class='bgx-pic-toolbar-space'/>
            <button class='btn btn-default toolbar-select-all' onclick={this.selectAll}>全选</button>
          </div>
          <div class='bgx-pic-images'>
            { this.displayImage.map(item => <DisplayImg item={item}/>) }
          </div>
        </div>
      </div>
    );
  }

  private sizeCheck(value: ImageInfo) {
    if (this.bgxMaxImageSize != null && value.height > this.bgxMaxImageSize && value.width > this.bgxMaxImageSize) {
      alert(`请选择长宽小于 ${this.bgxMaxImageSize} 的图片`);
      return false;
    }
    if (this.bgxMinImageSize != null && value.height < this.bgxMinImageSize && value.width < this.bgxMinImageSize) {
      alert(`请选择长宽大于 ${this.bgxMinImageSize} 的图片`);
      return false;
    }
    if (this.bgxMustSquare && value.height !== value.width) {
      alert(`请选择长度宽度相等的图片`);
      return false;
    }
    return true;
  }
}


// 挂载为jquery插件
mountModal({
  name: 'pictureSelector',
  title: '图片选择',
  content: PictureSelectorComponent,
  style: 'width: 1000px;',
  onOk(instance: PictureSelectorComponent) {
    instance?.bgxOnOk(instance.selectedImg.map(value => value.url));
  }
});
