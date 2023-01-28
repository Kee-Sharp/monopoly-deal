import { stagesMap } from "./constants";
import type { FullSets, Player, PropertyMap, SolidColor } from "./gameReducer";

export const takeFirstN = <T>(arr: T[], n: number): [firstN: T[], remaining: T[]] => {
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

export const removeFromArray = <T>(
  arr: T[],
  index: number
): [newArray: T[], oldValue: T] => {
  const newArray: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i !== index) newArray.push(arr[i]);
  }
  return [newArray, arr[index]];
};

export const sortCards = <T extends { id: number }>(cards: T[]) => {
  return [...cards].sort((cardA, cardB) => cardA.id - cardB.id);
};

export const createPropertyMap = (properties: Player["properties"]) => {
  return properties.reduce((map, property) => {
    const color = property.actingColor ?? (property.color as SolidColor);
    return { ...map, [color]: [...(map[color] ?? []), property] };
  }, {} as PropertyMap);
};

export const updateFullSets = (properties: Player["properties"]) => {
  const propertyMap = createPropertyMap(properties);
  return Object.entries(propertyMap).reduce((acc, [color, pile]) => {
    const stages = stagesMap[color as SolidColor];
    return { ...acc, [color]: pile.length >= stages.length };
  }, {} as FullSets);
};
