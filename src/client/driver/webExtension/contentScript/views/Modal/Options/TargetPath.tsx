import { observer } from 'mobx-react-lite';
import { CaretDownFilled, LoadingOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { useClick, useFloating, useInteractions, offset } from '@floating-ui/react';
import { useClickAway, useBoolean } from 'ahooks';
import { container } from 'tsyringe';

import Tree from '../../../../../../components/Tree';
import ConfigService from '@domain/service/ConfigService';

export default observer(function TargetPath() {
  const [isOpen, { setTrue: open, setFalse: close, set: setIsOpen }] = useBoolean(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [offset(10)],
  });

  const click = useClick(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click]);
  const config = container.resolve(ConfigService);

  useEffect(() => {
    if (!config.targetTree || isOpen) {
      config.updateTargetTree();
    }
  }, [config, isOpen]);

  useEffect(() => {
    const { targetTree } = config;

    if (targetTree) {
      targetTree.on('nodeSelected', close);

      return () => {
        targetTree.off('nodeSelected', close);
      };
    }
  }, [close, config, config.targetTree]);

  useClickAway(close, [refs.domReference, refs.floating]);

  return (
    <div className="relative min-w-0 grow rounded-md bg-white">
      <div
        onClick={open}
        ref={refs.setReference}
        {...getReferenceProps()}
        title={config.target.path}
        className="cursor-pointer truncate border p-2"
      >
        <span>{config.target.title || config.targetTree?.root.title}</span>
        <CaretDownFilled className="absolute right-5 top-1/2 -translate-y-1/2 opacity-60" />
      </div>
      {isOpen && (
        <div
          ref={refs.setFloating}
          {...getFloatingProps()}
          style={floatingStyles}
          className=" max-h-80 w-[400px] overflow-auto rounded-md bg-white p-2 shadow-md"
        >
          {config.targetTree ? (
            <Tree
              tree={config.targetTree}
              rootTitle="root"
              className="w-full"
              nodeClassName="flex items-center cursor-pointer py-1 pl-2 data-[selected=true]:text-white data-[selected=true]:bg-blue-400"
              titleClassName="truncate min-w-0 "
              loadingIcon={<LoadingOutlined className="mr-1" />}
              emptyChildrenView={({ indent }) => (
                <div className="text-xs italic text-gray-500" style={{ paddingLeft: indent }}>
                  暂无子目录
                </div>
              )}
            />
          ) : (
            <LoadingOutlined />
          )}
        </div>
      )}
    </div>
  );
});
