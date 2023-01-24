import { useState } from "react";

export const useToggle = <T = boolean>(initialState: T[] = []) => {
  const [arr, setArray] = useState<(T | undefined)[]>(initialState);
  const toggle = (index: number, value?: T) => {
    const newArr = [...arr];
    if (value) {
      newArr[index] = !!arr[index] ? undefined : value;
    } else {
      newArr[index] = !arr[index] as T;
    }
    setArray(newArr);
  };
  return [arr, toggle] as const;
};
