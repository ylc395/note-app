import { observer } from 'mobx-react-lite';
import { noop } from 'lodash-es';
import { useState, type ReactNode, useEffect, useRef } from 'react';
import { useKeyPress } from 'ahooks';

import { IS_DEV } from '@shared/domain/infra/constants';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import type { HierarchyEntity } from '@shared/domain/model/entity';
import Icon from '@web/components/icon/Icon';
import clsx from 'clsx';

export interface Props<T extends HierarchyEntity> {
  node: TreeNode<T>;
  children?: ReactNode;
  defaultIcon?: (node: TreeNode<T>) => ReactNode;
  isEditing?: boolean;
  onEditEnd?: (value: string) => void;
  onEditCancel?: () => void;
}

export default observer(function NodeTitle<T extends HierarchyEntity>({
  node,
  children,
  onEditCancel,
  onEditEnd,
  defaultIcon,
  isEditing,
}: Props<T>) {
  const [value, setValue] = useState(node.title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const title = `${IS_DEV ? `${node.id.slice(0, 3)} ` : ''}${node.title}`;
  const submit = () => onEditEnd?.(value);

  useKeyPress('enter', isEditing ? submit : noop);
  useKeyPress('esc', isEditing && onEditCancel ? onEditCancel : noop);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <span className="flex min-w-0 w-full justify-between items-center">
      <Icon code={node.icon} fallback={defaultIcon?.(node)} />
      {isEditing ? (
        <input
          className="h-4 outline-none"
          ref={inputRef}
          onBlur={submit}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : (
        <span className={clsx('whitespace-nowrap min-w-0')}>{title}</span>
      )}
      {children && <span className="hidden h-full items-center group-hover:flex">{children}</span>}
    </span>
  );
});
