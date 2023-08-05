import { useEffect } from 'react';

export default function usePreventScroll(enable: boolean) {
  useEffect(() => {
    if (enable) {
      const bodyStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = bodyStyle;
      };
    }
  }, [enable]);
}
