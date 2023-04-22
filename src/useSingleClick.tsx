import React, { useCallback, useRef } from "react";

const useSingleClick = <Args extends any[], ReturnType>(
  callback: (...args: Args) => ReturnType,
  deps: React.DependencyList,
  delay: number
) => {
  const timer = useRef<number>();
  const wrappedCallback = useCallback(callback, deps);
  return useCallback(
    (...args: Args) => {
      if (!timer.current) {
        timer.current = setTimeout(() => {
          timer.current = undefined;
        }, delay);
        return wrappedCallback(...args);
      } else {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          timer.current = undefined;
        }, delay);
      }
    },
    [wrappedCallback, delay]
  );
};

export default useSingleClick;
