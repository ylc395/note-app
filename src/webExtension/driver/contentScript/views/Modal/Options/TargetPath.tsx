// import { observer } from 'mobx-react-lite';
// import { CaretDownFilled } from '@ant-design/icons';
// import { useEffect, useState, useContext } from 'react';
// import { useClick, useFloating, useInteractions, offset } from '@floating-ui/react';
// import { useClickAway } from 'ahooks';
// import { container } from 'tsyringe';

// import Tree from 'components/Tree';
// import ConfigService from 'service/ConfigService';

// export default observer(function () {
//   const [isOpen, setIsOpen] = useState(false);
//   const { refs, floatingStyles, context } = useFloating({
//     open: isOpen,
//     onOpenChange: setIsOpen,
//     placement: 'bottom',
//     middleware: [offset(10)],
//   });

//   const click = useClick(context);
//   const { getReferenceProps, getFloatingProps } = useInteractions([click]);
//   const config = container.resolve(ConfigService);

//   useEffect(() => {
//     if (config.targetTree) {
//       const { targetTree } = config;
//       const close = () => setIsOpen(false);
//       targetTree.on('nodeSelected', close);

//       return () => {
//         targetTree.off('nodeSelected', close);
//       };
//     }
//   }, [config, config.targetTree]);

//   useClickAway(() => setIsOpen(false), [refs.domReference, refs.floating]);

//   return (
//     <div className="relative min-w-0 grow cursor-default rounded-md bg-white px-4 py-1">
//       {config.target && (
//         <div ref={refs.setReference} {...getReferenceProps()} title={config.target.path} className="truncate">
//           <span>{config.target.title}</span>
//           <CaretDownFilled className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60" />
//         </div>
//       )}
//       {config.targetTree && isOpen && (
//         <div
//           ref={refs.setFloating}
//           {...getFloatingProps()}
//           style={floatingStyles}
//           className=" max-h-36 overflow-auto rounded-md bg-white p-2 shadow-md"
//         >
//           <Tree tree={config.targetTree} />
//         </div>
//       )}
//     </div>
//   );
// });
