import { createVNode } from '../../mvvm/v-node';
import './index.less'

export function Iconfont (props: {type: string}) {

  const {
    type,
    ...restProps
  } = props;
  return (
    <i class={'topsales ' + type} {...restProps} />
    // <svg class="icon" aria-hidden="true">
    //   <use href={`#${type}`}/>
    // </svg>
  )
}


