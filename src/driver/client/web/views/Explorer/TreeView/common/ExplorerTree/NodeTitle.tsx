import { observer } from 'mobx-react-lite';
import { noop } from 'lodash-es';
import { useState, type ReactNode, useEffect, useRef } from 'react';
import { useKeyPress } from 'ahooks';

import { IS_DEV } from '#domain/shared/infra/constants';
import type TreeNode from '#domain/client/common/model/abstract/TreeNode';
import type { HierarchyEntity } from '#domain/shared/model/entity';
import Icon from '#web/components/icon/Icon';
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
    <span className="ml-1 flex min-w-0 w-full justify-between items-center">
      <span className="flex items-center min-w-0">
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
          <span className={clsx('whitespace-nowrap overflow-hidden text-ellipsis')}>{title}</span>
        )}
      </span>
      {children && <span className="hidden h-full items-center group-hover:flex">{children}</span>}
    </span>
  );
});
