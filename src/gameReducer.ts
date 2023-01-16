import { Reducer } from "react";
import cards from "./cards.json";

type CardType = "action" | "property" | "money" | "rent";
// prettier-ignore
type Color =
  | "blue" | "green" | "yellow"
  | "red" | "orange" | "pink"
  | "black" | "light_blue" | "light_green"
  | "brown" | "rainbow";
interface Card {
  id: number;
  type: CardType;
  value: number;
  title?: string;
  color?: Color | [Color, Color];
  stages?: number[];
}
interface Player {
  id: string;
  nickname: string;
  hand: Card[];
  properties: { [color in Color]: Card[] };
  money: Card[];
  rentDue?: { playerId: string; amount: number };
}
export interface GameState {
  players: Player[];
  deck: Card[];
  currentTurn?: string;
  messages: { id: string; content: string }[];
}

export const init = (): GameState => {
  return { players: [], deck: cards as Card[], messages: [] };
};

const reducer: Reducer<GameState, any> = (state, action) => {
  return state;
};

export default reducer;
