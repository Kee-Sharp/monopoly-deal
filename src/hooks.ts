import { useState } from "react";

export const useToggle = (initialState: any[] = []) => {
  const [arr, setArray] = useState(initialState);
  const toggle = (index: number, value?: any) => {
    const newArr = [...arr];
    if (value) {
      newArr[index] = !!arr[index] ? undefined : value;
    } else {
      newArr[index] = !arr[index];
    }
    setArray(newArr);
  };
  return [arr, toggle, setArray] as const;
};
