import './index.less';
import { ValueComponentProps, ValueComponent, VNode, mountComponent, createVNode } from 'jeact';

export interface PmSelectorOption {
  value: any;
  label: string;
  checked?: boolean;
  parent?: PmSelectorOption;
  children?: PmSelectorOption[];
}

export interface PmSelectorComponentProps extends ValueComponentProps<any[]> {
  placeholder?: string;
  options?: any[];
  valueField?: string;
  labelField?: string;
  childrenField?: string;
  cacheName?: string;
  url: string;
  psPlaceholder?: string;
  psOptions?: any[];
  psValueField?: string;
  psLabelField?: string;
  psChildrenField?: string;
  psCacheName?: string;
  value?: any[];
  psUrl: string;
}

export class PmSelectorComponent extends ValueComponent<any[]> {
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
    this.convertedOptions = this.convert(
      value,
      this.valueField,
      this.labelField,
      this.childrenField,
      null,
      this.value,
    );
    this.leafOptions = this.leafChildren(this.convertedOptions);
    this.loadCommonOption();
    this.update();
  }
  private _url: string;
  get url(): string {
    return this._url;
  }

  set url(value: string) {
    this._url = value;
    window['$'].get(value, (res) => {
      if (res && res.success) {
        this.options = res.result;
      }
    });
  }

  convertedOptions: PmSelectorOption[] = [];
  readonly saveCommonMax = 10;
  open = false;
  commonOptions: PmSelectorOption[] = [];
  commonCheckedAll = false;
  selectedIndexes: number[] = [];
  leafOptions: PmSelectorOption[] = [];
  searchText = '';
  searchOptions: PmSelectorOption[] = [];
  searchCheckedAll = false;
  showSearch = true;

  get columns(): PmSelectorOption[][] {
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

  // 获取被勾选的所有叶子节点
  get checkedOptions(): PmSelectorOption[] {
    let checkedOptions = [];
    let options = this.convertedOptions; // 待搜索列表
    while (options.length > 0) {
      // 新增放进待搜索列表
      const currChecked = options.filter(
        (value) => (!value.children || !value.children.length) && value.checked,
      );
      checkedOptions = checkedOptions.concat(currChecked);
      options = options
        .filter((value) => value.children && value.children.length)
        .flatMap((value) => value.children); // 搜索待搜索列表
    }
    return checkedOptions;
  }

  // 用于界面展示
  get checkedOptionStr(): string {
    return this.checkedOptions.map((value) => value.label).join(',');
  }

  constructor(args: PmSelectorComponentProps) {
    super(args);
    this.placeholder = args.psPlaceholder || args.placeholder;
    this.valueField = args.psValueField || args.valueField || 'value';
    this.labelField = args.psLabelField || args.labelField || 'label';
    this.childrenField = args.psChildrenField || args.childrenField || 'children';
    this.cacheName = args.psCacheName || args.cacheName || 'commonOptions';
    this.value = args.value || [];
    if (args.psOptions || args.options) {
      this.options = args.psOptions || args.options;
    } else if (args.psUrl || args.url) {
      this.url = args.psUrl || args.url;
    }
  }

  writeValue(value: string) {
    this.value = value ? value.split(',') : [];
    if (this.convertedOptions != null) {
      this.leafOptions.forEach((value1) => (value1.checked = this.value.includes(value1.value)));
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

  // 关闭搜索弹窗
  closeSearchPopup() {
    this.showSearch = false;
    this.update();
  }

  // 打开搜索弹窗
  openSearchPopup = () => {
    this.showSearch = true;
    this.update();
  };

  // 勾选
  checkOption(option: PmSelectorOption, checked: boolean) {
    option.checked = checked;
    this.checkChildren(option, checked);
    this.checkAll(option.parent);
    this.checkCommonOption();
    this.checkSearchOption();
    this.onChange(this.checkedOptions.map((value1) => value1.value));
    this.update();
  }

  commonCheckAll = (e: Event) => {
    const checked = e.target['checked'];
    this.commonOptions.forEach((value) => this.checkOption(value, checked));
    this.update();
  };

  leafChildren(options: PmSelectorOption[]): PmSelectorOption[] {
    const childrenLeaf = options.flatMap((value) => this.leafChildren(value.children));
    const leaf = options.filter((value) => !value.children || !value.children.length);
    return [...childrenLeaf, ...leaf];
  }

  clear = () => {
    this.searchText = '';
    this.commonCheckedAll = false;
    this.checkedOptions.forEach((value) => {
      value.checked = false;
      this.checkAll(value.parent);
    });
    this.update();
    this.onChange([]);
  };

  searchChange = (e: Event) => {
    this.searchText = e.target['value'];
    this.searchOptions = this.leafOptions.filter((value) => {
      return value.label && value.label.includes(this.searchText);
    });
    this.checkSearchOption();
    this.update();
  };

  searchCheckAll = (e) => {
    const checked = e.target['checked'];
    this.searchOptions.forEach((value) => this.checkOption(value, checked));
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
    this.update();
  }

  // 格式化外部option为内部option
  convert(
    options: any[],
    valueField,
    labelField,
    childrenField,
    parent: PmSelectorOption,
    values?: any[],
  ): PmSelectorOption[] {
    return (options || []).map((option) => {
      const obj: PmSelectorOption = {
        value: option[valueField],
        label: option[labelField],
        checked: (values || []).includes(String(option[valueField])),
        parent,
      };
      obj.children = this.convert(
        option[childrenField] || [],
        valueField,
        labelField,
        childrenField,
        obj,
        values,
      );
      return obj;
    });
  }

  optionChange(e: Event, option: PmSelectorOption) {
    const checked = e.target['checked'];
    this.checkOption(option, checked);
    this.update();
  }

  // 判断父节点是否需要勾选(当子节点全选时)
  checkAll(option: PmSelectorOption) {
    if (!option) {
      return;
    }
    const check =
      option.children &&
      option.children.length > 0 &&
      option.children.every((value) => value.checked);
    if (check !== option.checked) {
      option.checked = check;
      this.checkAll(option.parent);
    }
  }

  // 设置option的check状态，并递归更新子节点，然后saveCommonOption
  checkChildren(option: PmSelectorOption, check: boolean) {
    option.checked = check;
    if (option.children && option.children.length > 0) {
      option.children.forEach((value) => {
        this.checkChildren(value, check);
      });
    } else if (check) {
      // 如果是被选中的叶子节点
      this.saveCommonOption(option);
    }
  }

  // 展开下一级菜单
  nextLevel(level: number, index: number) {
    this.selectedIndexes = this.selectedIndexes.slice(0, level);
    this.selectedIndexes[level] = index;
    this.update();
  }

  // 保存常用选择到localStorage中
  saveCommonOption(option: PmSelectorOption) {
    if (this.commonOptions.includes(option)) {
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

  // 更新常用选择全选状态
  checkCommonOption() {
    this.commonCheckedAll =
      this.commonOptions &&
      this.commonOptions.length &&
      this.commonOptions.every((value) => value.checked);
  }

  // 更新搜索选择全选状态
  checkSearchOption() {
    this.searchCheckedAll =
      this.searchOptions &&
      this.searchOptions.length &&
      this.searchOptions.every((value) => value.checked);
  }

  render() {
    const checkedOptions = this.checkedOptions;
    let popup: VNode;
    if (this.open) {
      popup = (
        <div class="ps-popup" ref="popup">
          {/*搜索栏*/}
          <div class="ps-search-bar">
            <div class="ps-search-input" ref="search">
              <input
                type="text"
                class="form-control input-sm"
                value={this.searchText}
                oninput={this.searchChange}
                onfocus={this.openSearchPopup}
                placeholder="请输入搜索关键字"
              />
              {this.searchText && this.showSearch && (
                <div class="ps-search-popup">
                  <label class="ps-label">
                    <input
                      class="ps-checkbox"
                      type="checkbox"
                      checked={this.searchCheckedAll}
                      onchange={this.searchCheckAll}
                    />
                    全选
                  </label>
                  <div class="ps-label ps-search-options">
                    {this.searchOptions.map((value) => (
                      <label key={value.value} class="ps-label ps-search-option">
                        <input
                          class="ps-checkbox"
                          type="checkbox"
                          checked={value.checked}
                          onchange={(e) => this.optionChange(e, value)}
                        />
                        <span
                          dangerouslySetInnerHTML={value.label.replace(this.searchText, (str) =>
                            str.fontcolor('#1481db'),
                          )}
                        ></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button class="btn btn-default btn-sm" type="button" onclick={this.clear}>
              清空
            </button>
          </div>
          {/*常用选择*/}
          <div class="ps-commonly-used">
            <label class="ps-label">
              <input
                class="ps-checkbox"
                type="checkbox"
                checked={this.commonCheckedAll}
                onchange={this.commonCheckAll}
              />
              常用选择
            </label>
            <div class="ps-commonly-used-options">
              {this.commonOptions.map((value) => (
                <label key={value.value} class="ps-label ps-commonly-used-option">
                  <input
                    class="ps-checkbox"
                    type="checkbox"
                    checked={value.checked}
                    onchange={(e) => this.optionChange(e, value)}
                  />
                  {value.label}
                </label>
              ))}
            </div>
          </div>
          {/*options*/}
          <div class="ps-options">
            {this.columns.map(
              (value, level) =>
                value && (
                  <div class="ps-column">
                    {value.map((value1, index) => (
                      <div
                        class={[
                          'ps-option',
                          value1.children && value1.children.length > 0 ? 'ps-option-next' : '',
                          index === this.selectedIndexes[level] ? 'ps-option-selected' : '',
                        ].join(' ')}
                        onclick={() => this.nextLevel(level, index)}
                      >
                        <input
                          class="ps-checkbox"
                          type="checkbox"
                          onchange={(e) => this.optionChange(e, value1)}
                          checked={value1.checked}
                        />
                        <div class="ps-option-text" title={value1.label}>
                          {value1.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ),
            )}
          </div>
          {/*已选择计数*/}
          <div class="ps-selected-cnt">
            <span class="ps-selected-label">已选择</span>
            {String(checkedOptions.length)}/{this.leafOptions.length}
          </div>
          {/*已选择option*/}
          <div class="ps-selected-tags">
            {checkedOptions.map((value) => (
              <div class="ps-selected-tag">
                {value.label}
                <span class="ps-close" onclick={() => this.checkOption(value, false)}>
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div class="ps-selector" ref="selector">
        <div class="input-group">
          <input
            type="text"
            class="form-control input-sm ps-input"
            value={this.checkedOptionStr}
            placeholder={this.placeholder}
            onclick={this.openPopup}
            aria-describedby="basic-addon2"
            readonly
          />
          <span class="input-group-addon" id="basic-addon2">
            {this.checkedOptions.length}项
          </span>
        </div>
        {popup}
      </div>
    );
  }
}

// 挂载为jquery插件
mountComponent({
  name: 'pmSelector',
  componentType: PmSelectorComponent,
  props: [
    'psValueField',
    'psLabelField',
    'psChildrenField',
    'psPlaceholder',
    'psUrl',
    'psCacheName',
  ],
});
