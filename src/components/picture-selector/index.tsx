import { Component } from '../../mvvm';
import { createVNode } from '../../mvvm/v-node';
import './index.less'
import { mountModal } from '../../utils';
import classname from 'classname';
import Sortable from 'sortablejs';


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

  get selectedImg(): ImageInfo[] {
    return this._selectedImg;
  }
  set selectedImg(value: ImageInfo[]) {
    this._selectedImg = value || [];
  }
  private _selectedImg: ImageInfo[] = [];


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

    this.pics = args.pics;
  }

  mounted() {
    super.mounted();

    const wrapper = this.refs.sortWrapper as HTMLElement;
    new Sortable(wrapper, {
      animation: 150,
      setData(dataTransfer) {
        dataTransfer
      }
    });
  }

  selectAll = e => {
    const num = this.bgxMaxImageNum - this._selectedImg.length;
    const unselectedImg = this.displayImgs.filter(value => !this.isSelected(value));
    const newImgs = unselectedImg.slice(0, num);
    this._selectedImg = this._selectedImg.concat(newImgs);
    this.update();
  };

  isSelected = (item: ImageInfo) => {
    return this._selectedImg && this._selectedImg.some(val => val.mainImgUrl === (item && item.mainImgUrl));
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
    console.log(this);
    if (this._selectedImg.length >= this.bgxMaxImageNum) {
      // this.msg.info(`最多选择${this.bgxMaxImageNum}张图片！`);
      return;
    }
    this._selectedImg = [...this._selectedImg, item];
  }

  removeImg(item: ImageInfo) {
    const index = this._selectedImg.findIndex(val => val.mainImgUrl === item.mainImgUrl);
    this._selectedImg.splice(index, 1);
    this._selectedImg = [...this._selectedImg];
  }

  private codeChange(value: any) {
    this.code = value;
    $.ajax('http://192.168.1.146:8783/saleslister/product/getProductImageBySkuOrPoa', {
      success: async (res) => {
        this.imageList = await this.getImageInfos(res.result)
      },
      type: 'POST',
      contentType: "application/json",
      data: JSON.stringify({
        "platformNo": 0,
        "skuOrPoa": value
      }),
    });
  }



  render() {

    return (
      <div class="bgx-picture-selector">
        <div class="bgx-pic-selected-images" ref="sortWrapper">
          {
            this.selectedImg.map(item => (
              <div class="bgx-pic-selected-option-wrapper" >
                <img src={item.mainImgUrl} class="bgx-pic-selected-img"/>
              </div>
            ))
          }
        </div>
        <div class="bgx-pic-selector-content">
          <div class="bgx-pic-toolbar">
            <input class="form-control bgx-pic-toolbar-input" placeholder="搜索SKU/POA" value={this.code}
                     onChange={e => this.codeChange(e.target.value)}/>
            <select class="form-control bgx-pic-toolbar-input" ngModel="poaFilter" placeholder="过滤POA图片"
                    ngModelChange="loadImage($event)">
              {this.poaList.map(value => <option  value={value.value}>{value.label}</option>)}
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
            {
              this.displayImgs.map(item => {
                return (
                  <div onclick={() => this.clickImg(item)}
                       class={classname(['bgx-pic-images-option', {'bgx-pic-images-option-selected': this.isSelected(item)}])}>
                    <div class="bgx-pic-images-option-wrapper" contextmenu="contextMenu($event, menu, index)">
                      <img src={item.mainImgUrl} class="bgx-pic-images-option-img"/>
                      <div class="bgx-pic-images-option-mask" >
                        <i class="bgx-pic-images-option-selected-icon">√</i>
                      </div>
                    </div>
                    <div>
                      <span>{item.width + '*' + item.height + ' ' + item.type}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    );
  }
}


// 挂载为jquery插件
mountModal({
  name: 'pictureSelector',
  componentType: PictureSelectorComponent,
  props: {
    width: '1000px',
  }
});
