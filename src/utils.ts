import { stagesMap } from "./constants";
import type { FullSets, Player, PropertyMap, SolidColor, TCard, GameState } from "./gameReducer";

export const takeFirstN = <T>(arr: T[], n: number): [firstN: T[], remaining: T[]] => {
  return [arr.slice(0, n), arr.slice(n)];
};

export const setValueInArray = <T, V extends T = T>(arr: T[], index: number, value: V) => {
  const newArray = [...arr];
  newArray[index] = value;
  return newArray;
};

export const removeFromArray = <T>(arr: T[], index: number): [newArray: T[], oldValue: T] => {
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

export const partition = <T>(arr: T[], predicate: (element: T, index: number) => boolean) => {
  return arr.reduce<[T[], T[]]>(
    ([truthy, falsy], element, index) => {
      const result = predicate(element, index);
      return result ? [[...truthy, element], falsy] : [truthy, [...falsy, element]];
    },
    [[], []]
  );
};

export const addWinner = (state: GameState): GameState => {
  const { players, messages } = state;
  let winner = null;
  for (let player of Object.values(players)) {
    const { fullSets = {}, properties = [] } = player;
    const propertyMap = createPropertyMap(properties);
    if (Object.keys(propertyMap).length === 10) {
      const cards = Object.values(propertyMap).map(arr => arr[0]);
      winner = { player, cards };
      break;
    }
    const full = (Object.keys(fullSets) as SolidColor[]).filter(color => fullSets[color]);
    if (full.length >= 3) {
      const colorsToUse = full.slice(0, 3);
      const cards = colorsToUse.reduce<TCard[]>(
        (acc, color) => [...acc, ...propertyMap[color].slice(0, stagesMap[color].length)],
        []
      );
      winner = { player, cards };
      break;
    }
  }
  return {
    ...state,
    players: winner ? [] : players,
    winner,
    messages: [
      ...messages,
      ...(winner ? [{ id: "game", content: `${winner.player.nickname} won!` }] : []),
    ],
    gameStarted: !winner,
    ...(!!winner && { currentPlayerId: null }),
  } as GameState;
};
