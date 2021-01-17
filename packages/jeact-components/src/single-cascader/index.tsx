import { ValueComponentProps, ValueComponent, VNode, mountComponent, createVNode } from 'jeact';
import './index.less';

export interface SingleCascaderOption {
  value: any;
  label: string;
  selected?: boolean;
  parent?: SingleCascaderOption;
  children?: SingleCascaderOption[];
}

export interface SingleCascaderComponentProps extends ValueComponentProps<any[]> {
  placeholder?: string;
  options?: any[];
  valueField?: string;
  labelField?: string;
  childrenField?: string;
  cacheName?: string;
  value?: any;
}

export class SingleCascaderComponent extends ValueComponent<any[]> {
  placeholder: string;
  valueField: string;
  labelField: string;
  childrenField: string;
  value: any;
  cacheName: string;
  private _options: any[] = [];
  get options(): any[] {
    return this._options;
  }
  set options(value: any[]) {
    this._options = value;
    this.convertedOptions = this.convert(
      value,
      this.valueField,
      this.labelField,
      this.childrenField,
      null,
      this.value,
    );
    this.leafOptions = this.leafChildren(this.convertedOptions);
    if (this.selectedOptions.length) {
      this.selectedIndexes = this.getSelectedIndexes(this.selectedOptions[0]);
      this.selectedString = this.getSelectedString(this.selectedOptions[0]);
    }
    this.loadCommonOption();
    this.update();
  }

  convertedOptions: SingleCascaderOption[];
  readonly saveCommonMax = 10;
  open = false;
  commonOptions: SingleCascaderOption[] = [];
  showCommon = true;
  selectedIndexes: number[] = [];
  selectedString = '';
  leafOptions: SingleCascaderOption[] = [];
  searchText = '';
  searchOptions: any[] = [];
  showSearch = false;

  get columns(): SingleCascaderOption[][] {
    let list = this.convertedOptions;
    const result = [list];
    for (let i = 0; this.selectedIndexes[i] != null; i++) {
      const selectedIndex = this.selectedIndexes[i];
      if (
        list[selectedIndex] &&
        list[selectedIndex].children &&
        list[selectedIndex].children.length > 0
      ) {
        list = list[selectedIndex].children;
        result.push(list);
      } else {
        break;
      }
    }
    return result;
  }

  get selectedOptions(): SingleCascaderOption[] {
    return this.leafOptions.filter((value) => value.selected);
  }

  constructor(args: SingleCascaderComponentProps) {
    super(args);
  }

  writeValue(value: string) {
    this.value = value;
    if (this.convertedOptions != null) {
      this.leafOptions.forEach(
        (value1) => (value1.selected = String(this.value) === String(value1.value)),
      );
      if (this.selectedOptions.length) {
        this.selectedIndexes = this.getSelectedIndexes(this.selectedOptions[0]);
        this.selectedString = this.getSelectedString(this.selectedOptions[0]);
      }
      this.update();
    }
  }

  // 组件声明周期hook，当组件创建后调用，此时尚未挂载DOM
  beforeMount() {}

  // 组件声明周期hook，当组件挂载DOM后调用
  mounted() {
    document.addEventListener(
      'click',
      (e: any) => {
        if (this.refs.popup) {
          const path = e.path || (e.composedPath && e.composedPath());
          if (
            !(this.refs.popup as HTMLElement).contains(e.target) &&
            !path.includes(this.refs.popup)
          ) {
            this.closePopup();
          }
        }
        if (this.refs.search) {
          const path = e.path || (e.composedPath && e.composedPath());
          if (
            !(this.refs.search as HTMLElement).contains(e.target) &&
            !path.includes(this.refs.search)
          ) {
            this.closeSearchPopup();
          }
        }
      },
      true,
    );
  }

  // 选择
  selectOption(option: SingleCascaderOption, level?: number, index?: number) {
    if (level != null && index != null) {
      this.nextLevel(level, index);
    } else {
      this.selectedIndexes = this.getSelectedIndexes(option);
    }
    if (this.isLeaf(option)) {
      this.leafOptions.forEach((item) => (item.selected = false));
      option.selected = true;
      this.selectedString = this.getSelectedString(option);
      this.saveCommonOption(option);
      this.onChange(option.value);
      this.closePopup();
    }
    this.update();
  }

  // 展开下一级菜单
  nextLevel(level: number, index: number) {
    this.selectedIndexes = this.selectedIndexes.slice(0, level);
    this.selectedIndexes[level] = index;
    this.update();
  }

  getSelectedIndexes(option: SingleCascaderOption): number[] {
    const indexes = [];
    let selectedOption = option;
    while (selectedOption.parent) {
      const index = selectedOption.parent.children.findIndex(
        (val) => String(val.value) === String(selectedOption.value),
      );
      selectedOption = selectedOption.parent;
      indexes.unshift(index);
    }
    // 获取第一级index
    const firstIndex = this.convertedOptions.findIndex(
      (val) => String(val.value) === String(selectedOption.value),
    );
    indexes.unshift(firstIndex);
    return indexes;
  }

  getSelectedString(option: SingleCascaderOption): string {
    const stringArr = [];
    let selectedOption = option;
    while (selectedOption.parent) {
      const o = selectedOption.parent.children.find(
        (val) => String(val.value) === String(selectedOption.value),
      );
      selectedOption = selectedOption.parent;
      stringArr.unshift(o);
    }
    // 获取第一级index
    const firstOption = this.convertedOptions.find(
      (val) => String(val.value) === String(selectedOption.value),
    );
    stringArr.unshift(firstOption);
    return stringArr.map((val) => val.label).join(' > ');
  }

  clear = () => {
    this.searchText = '';
    this.searchOptions = [];
    this.selectedOptions.forEach((value) => {
      value.selected = false;
    });
    this.selectedIndexes = [];
    this.selectedString = '';
    this.update();
    this.onChange([]);
  };

  searchInput = (e: InputEvent) => {
    this.searchText = e.target['value'];
    this.update();
  };

  searchKeydown = (e: KeyboardEvent) => {
    if (e.code === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      this.searchChange();
    }
  };

  searchChange = () => {
    if (!this.searchText) {
      this.searchOptions = [];
      return;
    }
    const searchedOptionsLinked = this.searchChildren(this.convertedOptions, this.searchText);
    this.searchOptions = searchedOptionsLinked.map((value) => {
      const text = value.map((value1) => value1.label).join(' > ');
      return {
        text,
        html: text.replace(RegExp(this.searchText, 'ig'), (str) => str.fontcolor('red')),
        ids: value.map((value1) => value1.value),
        originOption: value[value.length - 1],
      };
    });
    this.openSearchPopup();
    this.update();
  };

  // 递归搜索children
  searchChildren(options: SingleCascaderOption[], searchText: string): SingleCascaderOption[][] {
    if (!options) {
      return [];
    }
    const lowerCaseSearchText = searchText.toLowerCase();
    const searchedOptions = options.filter((value) =>
      (value.label || '').toLowerCase().includes(lowerCaseSearchText),
    );
    const childrenOptionsLinked = this.leafChildrenLinked(searchedOptions);

    const notSearchedOptions = options.filter(
      (value) => !(value.label || '').toLowerCase().includes(lowerCaseSearchText),
    );
    const searchedOptionsLinked = notSearchedOptions
      .filter((value) => !this.isLeaf(value))
      .flatMap((value) => {
        return this.searchChildren(value.children, searchText).map((value1) => [value, ...value1]);
      });
    return [...searchedOptionsLinked, ...childrenOptionsLinked];
  }

  // options到叶子节点的数组的数组
  leafChildrenLinked(options: SingleCascaderOption[]): SingleCascaderOption[][] {
    if (!options) {
      return [];
    }
    const leafLinked = options.filter((value) => this.isLeaf(value)).map((value) => [value]);
    const childrenLeafLinked = options
      .filter((value) => !this.isLeaf(value))
      .flatMap((value) => {
        // 所有子节点和当前节点，拼成链
        return this.leafChildrenLinked(value.children).map((value1) => [value, ...value1]);
      });
    return [...leafLinked, ...childrenLeafLinked];
  }

  // 打开搜索弹窗
  openSearchPopup = () => {
    this.showSearch = true;
    this.update();
  };

  // 关闭搜索弹窗
  closeSearchPopup() {
    this.showSearch = false;
    this.update();
  }

  openPopup = (e: Event) => {
    e.stopPropagation();
    this.open = true;
    this.update();
  };

  closePopup() {
    this.open = false;
    this.searchText = '';
    this.searchOptions = [];
    this.closeSearchPopup();
    this.update();
  }

  switchCommon = () => {
    this.showCommon = !this.showCommon;
    this.update();
  };

  // 格式化外部option为内部option
  convert(
    options: any[],
    valueField,
    labelField,
    childrenField,
    parent: SingleCascaderOption,
    value?: any,
  ): SingleCascaderOption[] {
    return (options || []).map((option) => {
      const obj: SingleCascaderOption = {
        value: option[valueField],
        label: option[labelField],
        selected: String(value || '') === String(option[valueField]),
        parent,
      };
      obj.children = this.convert(
        option[childrenField] || [],
        valueField,
        labelField,
        childrenField,
        obj,
        value,
      );
      return obj;
    });
  }

  // 获取所有叶子节点
  leafChildren(options: SingleCascaderOption[]): SingleCascaderOption[] {
    const childrenLeaf = options.flatMap((value) => this.leafChildren(value.children));
    const leaf = options.filter((value) => this.isLeaf(value));
    return [...childrenLeaf, ...leaf];
  }

  isLeaf(option: SingleCascaderOption): boolean {
    return !option.children || !option.children.length;
  }

  // 保存常用选择到localStorage中
  saveCommonOption(option: SingleCascaderOption) {
    if (this.commonOptions.includes(option) || this.cacheName == null) {
      return;
    }
    this.commonOptions.unshift(option);
    if (this.commonOptions.length > this.saveCommonMax) {
      this.commonOptions = this.commonOptions.slice(0, this.saveCommonMax);
    }
    const commonOptions = this.commonOptions.map((value) => value.value);
    localStorage.setItem(this.cacheName, JSON.stringify(commonOptions));
  }

  // 加载localStorage中的常用选择
  loadCommonOption() {
    const commonOptions: string[] = JSON.parse(localStorage.getItem(this.cacheName)) || [];
    this.commonOptions = commonOptions
      .map((value) => this.leafOptions.find((value1) => value1.value === value))
      .filter((value) => value);
  }

  render() {
    let popup: VNode;
    if (this.open) {
      popup = (
        <div class="bgx-popup" ref="popup">
          {/*搜索栏*/}
          <div class="bgx-search-bar">
            <div class="bgx-search-input" ref="search">
              <div class="input-group">
                <input
                  type="text"
                  class="form-control input-sm"
                  value={this.searchText}
                  placeholder="请输入搜索关键字"
                  oninput={(e) => this.searchInput(e)}
                  onkeydown={(e) => this.searchKeydown(e)}
                  onfocus={this.openSearchPopup}
                />
                <span class="input-group-btn">
                  <button class="btn btn-primary btn-sm" type="button" onclick={this.searchChange}>
                    搜索
                  </button>
                </span>
              </div>
              {this.searchText && this.showSearch && (
                <div class="bgx-search-popup">
                  {this.searchOptions.length > 1 ? (
                    <div class="bgx-search-options">
                      {this.searchOptions.map((value) => (
                        <div
                          key={value.ids}
                          class={[
                            'bgx-search-option',
                            this.selectedOptions.includes(value.originOption)
                              ? 'bgx-option-selected'
                              : '',
                          ].join(' ')}
                          onclick={() => this.selectOption(value.originOption)}
                        >
                          <span dangerouslySetInnerHTML={value.html}></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div class="no-search-result">暂无搜索结果</div>
                  )}
                </div>
              )}
            </div>
            <button class="btn btn-default btn-sm" type="button" onclick={this.clear}>
              清空
            </button>
          </div>
          {/*常用选择*/}
          <div class="bgx-commonly-used">
            <div class="bgx-commonly-used-head">
              <label>常用选择</label>
              <i onclick={this.switchCommon}>{this.showCommon ? '-' : '+'}</i>
            </div>
            <div class="bgx-commonly-used-options">
              {this.showCommon &&
                this.commonOptions.length > 1 &&
                this.commonOptions.map((value) => (
                  <label
                    key={value.value}
                    class={[
                      'bgx-label bgx-commonly-used-option',
                      this.selectedOptions.includes(value) ? 'bgx-option-selected' : '',
                    ].join(' ')}
                    onclick={() => this.selectOption(value)}
                  >
                    <span>{value.label}</span>
                  </label>
                ))}
            </div>
          </div>
          {/*options*/}
          <div class="bgx-options">
            {this.columns.map(
              (value, level) =>
                value && (
                  <div class="bgx-column">
                    {value.map((value1, index) => (
                      <div
                        class={[
                          'bgx-option',
                          value1.children && value1.children.length > 0 ? 'bgx-option-next' : '',
                          index === this.selectedIndexes[level] ? 'bgx-option-selected' : '',
                        ].join(' ')}
                        onclick={() => this.selectOption(value1, level, index)}
                      >
                        <div class="bgx-option-text" title={value1.label}>
                          {value1.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ),
            )}
          </div>
        </div>
      );
    }

    return (
      <div class="bgx-single-cascader" ref="selector">
        <div class="input-group">
          <input
            type="text"
            class="form-control input-sm bgx-input"
            value={this.selectedString}
            placeholder={this.placeholder}
            onclick={this.openPopup}
            aria-describedby="basic-addon2"
            readonly
          />
        </div>
        {popup}
      </div>
    );
  }
}

// 挂载为jquery插件
mountComponent({
  name: 'singleCascader',
  componentType: SingleCascaderComponent,
  props: ['valueField', 'labelField', 'childrenField', 'placeholder', 'cacheName'],
});
