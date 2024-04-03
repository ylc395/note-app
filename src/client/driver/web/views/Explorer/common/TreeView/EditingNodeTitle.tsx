import assert from 'assert';
import { observer } from 'mobx-react-lite';
import { useState, type ReactNode, useEffect, useRef } from 'react';
import { useKeyPress } from 'ahooks';

import type TreeNode from '@domain/common/model/abstract/TreeNode';
import Icon from '@web/components/icon/Icon';
import type { HierarchyEntity } from '@shared/domain/model/entity';

export interface Props<T extends HierarchyEntity> {
  node: TreeNode<T>;
  defaultIcon?: (node: TreeNode<T>) => ReactNode;
  onEditEnd?: (value: string) => void;
  onEditCancel?: () => void;
}

export default observer(function EditingNodeTitle<T extends HierarchyEntity>({
  node,
  onEditEnd,
  onEditCancel,
  defaultIcon,
}: Props<T>) {
  const [value, setValue] = useState(node.title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  assert(onEditEnd && onEditCancel);

  const submit = () => onEditEnd(value);
  useKeyPress('enter', submit);
  useKeyPress('esc', onEditCancel);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, []);

  return (
    <span className="flex min-w-0 items-center">
      <Icon code={node.icon} fallback={defaultIcon?.(node)} />
      <input
        className="h-4  text-base"
        ref={inputRef}
        onBlur={submit}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </span>
  );
});
