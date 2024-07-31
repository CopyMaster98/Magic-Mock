import { useState, useRef, useCallback } from "react";

export const useDebouncedState = (initialValue: any, delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const timer = useRef<any>();

  const setDebouncedValue = useCallback(
    (newValue: any) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        setValue(newValue);
      }, delay);
    },
    [delay]
  );

  return [value, setDebouncedValue];
};
