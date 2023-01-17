export const takeFirstN = <T>(arr: T[], n: number): [T[], T[]] => {
  return [arr.slice(0, n), arr.slice(n)];
};

export const setValueInArray = <T, V extends T = T>(
  arr: T[],
  index: number,
  value: V
) => {
  const newArray = [...arr];
  newArray[index] = value;
  return newArray;
};

export const removeFromArray = <T>(arr: T[], index: number): [T[], T] => {
  const newArray: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i !== index) newArray.push(arr[i]);
  }
  return [newArray, arr[index]];
};
