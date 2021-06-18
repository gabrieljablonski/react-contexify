import React, { ReactNode } from 'react';
import cx from 'clsx';

import {
  ItemParams,
  InternalProps,
  BooleanPredicate,
  HandlerParamsEvent,
} from '../types';
import { useRefTrackerContext } from './RefTrackerProvider';
import { STYLE } from '../constants';
import { getPredicateValue } from './utils';

export interface ItemProps
  extends InternalProps,
    Omit<React.HTMLAttributes<HTMLElement>, 'hidden' | 'disabled' | 'onClick'> {
  /**
   * Any valid node that can be rendered
   */
  children?: ReactNode;

  /**
   * Passed to the `Item` onClick callback. Accessible via `data`
   */
  data?: any;

  /**
   * Disable `Item`. If a function is used, a boolean must be returned
   *
   * @param props The props passed when you called `show(e, {props: yourProps})`
   * @param data The data defined on the `Item`
   * @param triggerEvent The event that triggered the context menu
   *
   *
   * ```
   * function isItemDisabled({ triggerEvent, props, data }: PredicateParams<type of props, type of data>): boolean
   * <Item disabled={isItemDisabled} data={data}>content</Item>
   * ```
   */
  disabled?: BooleanPredicate;

  /**
   * Hide the `Item`. If a function is used, a boolean must be returned
   *
   * @param props The props passed when you called `show(e, {props: yourProps})`
   * @param data The data defined on the `Item`
   * @param triggerEvent The event that triggered the context menu
   *
   *
   * ```
   * function isItemHidden({ triggerEvent, props, data }: PredicateParams<type of props, type of data>): boolean
   * <Item hidden={isItemHidden} data={data}>content</Item>
   * ```
   */
  hidden?: BooleanPredicate;

  /**
   * Callback when the `Item` is clicked.
   *
   * @param event The event that occured on the Item node
   * @param props The props passed when you called `show(e, {props: yourProps})`
   * @param data The data defined on the `Item`
   * @param triggerEvent The event that triggered the context menu
   *
   * ```
   * function handleItemClick({ triggerEvent, event, props, data }: ItemParams<type of props, type of data>){
   *    // retrieve the id of the Item or any other dom attribute
   *    const id = e.currentTarget.id;
   *
   *    // access the props and the data
   *    console.log(props, data);
   *
   *    // access the coordinate of the mouse when the menu has been displayed
   *    const {  clientX, clientY } = triggerEvent;
   *
   * }
   *
   * <Item id="item-id" onClick={handleItemClick} data={{key: 'value'}}>Something</Item>
   * ```
   */
  onClick?: (args: ItemParams) => void;

  render?: (params: any) => ReactNode;
}

export const Item: React.FC<ItemProps> = ({
  id = '',
  children,
  className,
  style,
  triggerEvent,
  data,
  propsFromTrigger,
  onClick = null,
  disabled = false,
  hidden = false,
  render = null,
  ...rest
}) => {
  const refTracker = useRefTrackerContext();
  const handlerParams = {
    id,
    data,
    props: propsFromTrigger,
    triggerEvent: triggerEvent as HandlerParamsEvent,
  };

  const isDisabled =
    getPredicateValue(disabled, handlerParams) ||
    propsFromTrigger?.disabledPredicates?.[id]?.(handlerParams) ||
    false;
  const isHidden =
    getPredicateValue(hidden, handlerParams) ||
    propsFromTrigger?.hiddenPredicates?.[id]?.(handlerParams) ||
    false;

  function handleClick(e: React.MouseEvent<HTMLElement>) {
    (handlerParams as ItemParams).event = e;
    if (isDisabled) {
      e.stopPropagation();
    } else if (onClick) {
      onClick?.(handlerParams as ItemParams);
    } else {
      propsFromTrigger?.onClickHandlers?.[id]?.(handlerParams);
    }
  }

  function trackRef(node: HTMLElement | null) {
    if (node && !isDisabled)
      refTracker.set(node, {
        node,
        isSubmenu: false,
      });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter') {
      (handlerParams as ItemParams).event = e;
      onClick?.(handlerParams as ItemParams);
    }
  }

  if (isHidden) return null;

  const cssClasses = cx(STYLE.item, className, {
    [`${STYLE.itemDisabled}`]: isDisabled,
  });

  return (
    <div
      {...rest}
      className={cssClasses}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      ref={trackRef}
      tabIndex={-1}
      role="menuitem"
      aria-disabled={isDisabled}
    >
      <div className={STYLE.itemContent}>
        {render ? render(handlerParams) : children}
      </div>
    </div>
  );
};
