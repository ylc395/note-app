import assert from 'assert';
import { observer } from 'mobx-react-lite';
import { useState, type ReactNode, useEffect, useRef } from 'react';
import { useKeyPress } from 'ahooks';

import type TreeNode from '@domain/common/model/abstract/TreeNode';
import Icon from '@web/components/icon/Icon';

export interface Props {
  node: TreeNode;
  defaultIcon?: (node: TreeNode) => ReactNode;
  onEditEnd?: (value: string) => void;
  onEditCancel?: () => void;
}

export default observer(function EditingNodeTitle({ node, onEditEnd, onEditCancel, defaultIcon }: Props) {
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
