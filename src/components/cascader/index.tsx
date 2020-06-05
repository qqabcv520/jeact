import { ValueComponent } from '../../mvvm';
import { createVNode, VNode } from '../../mvvm/v-node';
import { mountComponent } from '../../utils';
import './index.less'
import { ValueComponentProps } from '../../mvvm/component';

export interface CascaderOption {
  value: any;
  label: string;
  checked?: boolean;
  parent?: CascaderOption;
  children?: CascaderOption[];
}

export interface CascaderComponentProps extends ValueComponentProps<any[]> {
  placeholder?: string;
  options?: any[];
  valueField?: string;
  labelField?: string;
  childrenField?: string;
  cacheName?: string;
  value?: any[];
}

export class CascaderComponent extends ValueComponent<any[]> {

  placeholder: string;
  valueField: string;
  labelField: string;
  childrenField: string;
  cacheName: string;
  value: any[];
  private _options: any[] = [];
  get options(): any[] {
    return this._options;
  }
  set options(value: any[]) {
    this._options = value;
    this.convertedOptions = this.convert(value, this.valueField, this.labelField, this.childrenField, null, this.value);
    this.leafOptions = this.leafChildren(this.convertedOptions);
    this.loadCommonOption();
    this.update();
  }

  convertedOptions: CascaderOption[] = [];
  readonly saveCommonMax = 10;
  open = false;
  commonOptions: CascaderOption[] = [];
  commonCheckedAll = false;
  showCommon = true;
  selectedIndexes: number[] = [];
  leafOptions: CascaderOption[] = [];
  searchText = '';
  searchOptions: any[] = [];
  searchCheckedAll = false;
  showSearch = false;

  get columns(): CascaderOption[][] {
    let list = this.convertedOptions;
    let result = [list];
    for (let i = 0; this.selectedIndexes[i] != null; i++) {
      const selectedIndex = this.selectedIndexes[i];
      if (list[selectedIndex] && list[selectedIndex].children && list[selectedIndex].children.length > 0) {
        list = list[selectedIndex].children;
        result.push(list);
      } else {
        break;
      }
    }
    return result;
  };

  // 获取被勾选的所有叶子节点
  get checkedOptions(): CascaderOption[] {
    let checkedOptions = [];
    let options = this.convertedOptions;  // 待搜索列表
    while (options.length > 0) {
      // 新增放进待搜索列表
      const currChecked = options.filter(value => (!value.children || !value.children.length) && value.checked);
      checkedOptions = checkedOptions.concat(currChecked);
      options = options.filter(value => value.children && value.children.length)
        .flatMap(value => value.children) // 搜索待搜索列表
    }
    return checkedOptions;
  }

  // 用于界面展示
  get checkedOptionStr(): string {
    return this.checkedOptions.map(value => value.label).join(',');
  }

  constructor(args: CascaderComponentProps) {
    super(args);
  }

  writeValue(value: string) {
    this.value = value ? value.split(',') : [];
    if (this.convertedOptions != null) {
      this.leafOptions.forEach(value1 => value1.checked = this.value.includes(value1.value))
      this.update();
    }
  }

  // 组件声明周期hook，当组件创建后调用，此时尚未挂载DOM
  beforeMount() {

  }

  // 组件声明周期hook，当组件挂载DOM后调用
  mounted() {
    document.addEventListener('click',(e: any) => {
      if (this.refs.popup) {
        const path = e.path || (e.composedPath && e.composedPath());
        if (!(this.refs.popup as HTMLElement).contains(e.target) && !path.includes(this.refs.popup)) {
          this.closePopup();
        }
      }
      if (this.refs.search) {
        const path = e.path || (e.composedPath && e.composedPath());
        if (!(this.refs.search as HTMLElement).contains(e.target) && !path.includes(this.refs.search)) {
          this.closeSearchPopup();
        }
      }
    }, true);
  }

  // 勾选
  checkOption(option: CascaderOption, checked: boolean) {
    option.checked = checked;
    this.checkChildren(option, checked);
    this.checkAll(option.parent);
    this.checkCommonOption();
    this.checkSearchOption();
    this.onChange(this.checkedOptions.map(value1 => value1.value));
    this.update();
  }

  // 展开下一级菜单
  nextLevel(level: number, index: number) {
    this.selectedIndexes[level] = index;
    this.update();
  }

  clear = () => {
    this.searchText = '';
    this.searchOptions = [];
    this.searchCheckedAll = false;
    this.commonCheckedAll = false;
    this.checkedOptions.forEach(value => {
      value.checked = false;
      this.checkAll(value.parent);
    });
    this.update();
    this.onChange([]);
  };

  searchInput = (e: InputEvent) => {
    this.searchText = e.target['value']
    this.update();
  }

  searchKeydown = (e: KeyboardEvent) => {
    if (e.code === 'Enter') {
      this.searchChange();
    }
  }

  searchChange = () => {
    if (!this.searchText) {
      this.searchOptions = [];
      return;
    }
    const searchedOptionsLinked = this.searchChildren(this.convertedOptions, this.searchText);
    this.searchOptions = searchedOptionsLinked.map(value => {
      const text = value.map(value1 => value1.label).join(' > ');
      return {
        text,
        html: text.replace(RegExp(this.searchText, 'ig'), str => str.fontcolor('red')),
        ids: value.map(value1 => value1.value),
        originOption: value[value.length - 1]
      };
    });
    this.checkSearchOption();
    this.openSearchPopup();
    this.update();
  };

  // 递归搜索children
  searchChildren(options: CascaderOption[], searchText: string): CascaderOption[][] {
    if (!options ) {
      return [];
    }
    const lowerCaseSearchText = searchText.toLowerCase();
    const searchedOptions = options.filter(value => (value.label || '').toLowerCase().includes(lowerCaseSearchText));
    const childrenOptionsLinked = this.leafChildrenLinked(searchedOptions);

    const notSearchedOptions = options.filter(value => !(value.label || '').toLowerCase().includes(lowerCaseSearchText));
    const searchedOptionsLinked = notSearchedOptions
        .filter(value => !this.isLeaf(value))
        .flatMap(value => {
          return this.searchChildren(value.children, searchText).map(value1 => [value, ...value1]);
        });
    return [...searchedOptionsLinked, ...childrenOptionsLinked];
  }

  // options到叶子节点的数组的数组
  leafChildrenLinked(options: CascaderOption[]): CascaderOption[][]  {
    if (!options) {
      return [];
    }
    const leafLinked = options
        .filter(value => this.isLeaf(value))
        .map(value => [value]);
    const childrenLeafLinked = options
        .filter(value => !this.isLeaf(value))
        .flatMap(value => { // 所有子节点和当前节点，拼成链
          return this.leafChildrenLinked(value.children).map(value1 => [value, ...value1]);
        });
    return [...leafLinked, ...childrenLeafLinked];
  }

  searchCheckAll = (e: InputEvent) => {
    const checked = e.target['checked'];
    this.searchOptions.forEach(value => this.checkOption(value.originOption, checked));
    this.update();
  };

  // 打开搜索弹窗
  openSearchPopup = () => {
    this.showSearch = true;
    this.update()
  };

  // 关闭搜索弹窗
  closeSearchPopup() {
    this.showSearch = false;
    this.update();
  };

  openPopup = (e: Event) => {
    e.stopPropagation();
    this.open = true;
    this.update();
  };

  closePopup() {
    this.open = false;
    this.searchText = '';
    this.searchOptions = [];
    this.searchCheckedAll = false;
    this.update();
  };

  switchCommon = () => {
    this.showCommon = !this.showCommon;
    this.update();
  }

  commonCheckAll = (e: InputEvent) => {
    const checked = e.target['checked'];
    this.commonOptions.forEach(value => this.checkOption(value, checked));
    this.update();
  };

  // 格式化外部option为内部option
  convert(
    options: any[],
    valueField,
    labelField,
    childrenField,
    parent: CascaderOption,
    values?: any[],
  ): CascaderOption[] {
    return (options || []).map(option => {
      const obj: CascaderOption = {
        value: option[valueField],
        label: option[labelField],
        checked: (values || []).includes(String(option[valueField])),
        parent,
      };
      obj.children = this.convert(option[childrenField] || [], valueField, labelField, childrenField, obj, values);
      return obj;
    })
  }

  leafChildren(options: CascaderOption[]): CascaderOption[] {
    const childrenLeaf = options.flatMap(value => this.leafChildren(value.children));
    const leaf = options.filter(value => this.isLeaf(value));
    return [...childrenLeaf, ...leaf];
  }

  isLeaf(option: CascaderOption): boolean {
    return (!option.children || !option.children.length);
  }

  optionChange(e: InputEvent, option: CascaderOption) {
    const checked = e.target['checked'];
    this.checkOption(option, checked);
    this.update();
  }

  // 判断父节点是否需要勾选(当子节点全选时)
  checkAll(option: CascaderOption) {
    if (!option) {
      return;
    }
    const check = !this.isLeaf(option) &&  option.children.every(value => value.checked);
    if (check !== option.checked) {
      option.checked = check;
      this.checkAll(option.parent);
    }
  }

  // 设置option的check状态，并递归更新子节点，然后saveCommonOption
  checkChildren(option: CascaderOption, check: boolean) {
    option.checked = check;
    if (!this.isLeaf(option)) {
      option.children.forEach(value => {
        this.checkChildren(value, check);
      });
    } else if (check) { // 如果是被选中的叶子节点
      this.saveCommonOption(option);
    }
  }

  // 保存常用选择到localStorage中
  saveCommonOption(option: CascaderOption) {
    if (this.commonOptions.includes(option) || this.cacheName == null) {
      return;
    }
    this.commonOptions.unshift(option);
    if (this.commonOptions.length > this.saveCommonMax) {
      this.commonOptions = this.commonOptions.slice(0, this.saveCommonMax);
    }
    const commonOptions = this.commonOptions.map(value => value.value);
    localStorage.setItem(this.cacheName, JSON.stringify(commonOptions));
  }

  // 加载localStorage中的常用选择
  loadCommonOption() {
    const commonOptions: string[] = JSON.parse(localStorage.getItem(this.cacheName)) || [];
    this.commonOptions = commonOptions.map(value => this.leafOptions.find(value1 => value1.value === value)).filter(value => value);
  }

  // 更新常用选择全选状态
  checkCommonOption() {
    this.commonCheckedAll = this.commonOptions && this.commonOptions.length && this.commonOptions.every(value => value.checked);
  }

  // 更新搜索选择全选状态
  checkSearchOption() {
    this.searchCheckedAll = this.searchOptions && this.searchOptions.length && this.searchOptions.every(value => value.originOption.checked);
  }

  render() {
    let popup: VNode;
    if (this.open) {
      popup = <div class="bgx-popup" ref="popup">
        {/*搜索栏*/}
        <div class="bgx-search-bar">
          <div class="bgx-search-input" ref="search">
            <div class="input-group">
              <input type="text" class="form-control input-sm" value={this.searchText} placeholder="请输入搜索关键字"
                     oninput={(e) => this.searchInput(e)} onkeydown={(e) => this.searchKeydown(e)} onfocus={this.openSearchPopup}/>
              <span class="input-group-btn">
                <button class="btn btn-primary btn-sm" type="button" onclick={this.searchChange}>搜索</button>
              </span>
            </div>
            {this.searchText && this.showSearch && (<div class="bgx-search-popup">
              {this.searchOptions.length > 1 ? [
                <div class="bgx-search-head">
                  <label class="bgx-label">
                    <input class="bgx-checkbox" type="checkbox" checked={this.searchCheckedAll} onchange={this.searchCheckAll}/>
                    全选
                  </label>
                </div>,
                <div class="bgx-search-options">
                  {this.searchOptions.map(value =>
                    <label key={value.value} class="bgx-label bgx-search-option">
                      <input class="bgx-checkbox" type="checkbox" checked={value.originOption.checked} onchange={(e) => this.optionChange(e, value.originOption)}/>
                      <span dangerouslySetInnerHTML={value.html}></span>
                    </label>
                  )}
                </div>] : <div class="no-search-result">暂无搜索结果</div>}
            </div>)}
          </div>
          <button class="btn btn-default btn-sm" type="button" onclick={this.clear}>清空</button>
        </div>
        {/*常用选择*/}
        <div class="bgx-commonly-used">
          <div class="bgx-commonly-used-head">
            <label class="bgx-label">
              <input class="bgx-checkbox" type="checkbox" checked={this.commonCheckedAll} onchange={this.commonCheckAll}/>
              常用选择
            </label>
            <i onclick={this.switchCommon}>{ this.showCommon ? '-' : '+'}</i>
          </div>
          <div class="bgx-commonly-used-options">
            {this.showCommon && this.commonOptions.length > 1 && this.commonOptions.map(value =>
              <label key={value.value} class="bgx-label bgx-commonly-used-option" title={value.label}>
                <input class="bgx-checkbox" type="checkbox" checked={value.checked} onchange={(e) => this.optionChange(e, value)}/>
                {value.label}
              </label>
            )}
          </div>
        </div>
        {/*options*/}
        <div class="bgx-options">
          {this.columns.map((value, level) => (
            value && <div class="bgx-column">
              {value.map((value1, index) =>
                <div
                  class={['bgx-option', value1.children && value1.children.length > 0 ? 'bgx-option-next' : '', index === this.selectedIndexes[level] ? 'bgx-option-selected' : ''].join(' ')}
                  onclick={() => this.nextLevel(level, index)}>
                  <input class="bgx-checkbox" type="checkbox" onchange={(e) => this.optionChange(e, value1)}
                         checked={value1.checked}/>
                  <div class="bgx-option-text" title={value1.label}>{value1.label}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        {/*已选择计数*/}
        <div class="bgx-selected-cnt">
          <span class="bgx-selected-label">已选择</span>
          {String(this.checkedOptions.length)}/{this.leafOptions.length}
        </div>
        {/*已选择option*/}
        <div class="bgx-selected-tags">
          {this.checkedOptions.map(value =>
            <div class="bgx-selected-tag">
              {value.label}
              <span class="bgx-close" onclick={() => this.checkOption(value, false)}>×</span>
            </div>
          )}
        </div>
      </div>;
    }

    return (
      <div class="bgx-cascader" ref="selector">
        <div class="input-group">
          <input type="text" class="form-control input-sm bgx-input" value={this.checkedOptionStr} placeholder={this.placeholder} onclick={this.openPopup}
                 aria-describedby="basic-addon2" readonly/>
          <span class="input-group-addon" id="basic-addon2">{this.checkedOptions.length}项</span>
        </div>
        {popup}
      </div>
    );
  }
}


// 挂载为jquery插件
mountComponent({
  name: 'cascader',
  componentType: CascaderComponent,
  props: ['valueField', 'labelField', 'childrenField', 'placeholder', 'cacheName'],
})
