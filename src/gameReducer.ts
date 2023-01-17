import _ from "lodash";
import { Reducer } from "react";
import cards from "./cards.json";
import { removeFromArray, setValueInArray, takeFirstN } from "./utils";

// prettier-ignore
export const colors = [
  "blue", "green", "yellow",
  "red", "orange", "pink",
  "black", "light_blue", "brown",
  "light_green",
] as const;
export type SolidColor = typeof colors[number];
export type Color = SolidColor | "rainbow";

export type TCard = {
  id: number;
  value: number;
} & (
  | { type: "action"; title: string; description: string }
  | { type: "property"; color: Color | [SolidColor, SolidColor]; stages: number[] }
  | { type: "money" }
  | { type: "rent"; color: Color | [SolidColor, SolidColor]; description: string }
);

export interface Player {
  id: string;
  nickname: string;
  hand: TCard[];
  properties: { [color in SolidColor]?: Extract<TCard, { type: "property" }>[] };
  money: TCard[];
  rentDue?: { playerId: string; amount: number };
}
export interface GameState {
  players: Player[];
  deck: TCard[];
  currentTurn?: string;
  messages: { id: string; content: string }[];
}

export const init = (): GameState => {
  return {
    players: [],
    deck: _.shuffle(cards) as TCard[],
    messages: [{ id: "game", content: "Game created" }],
  };
};

type PayloadAction<T, P = undefined> = P extends undefined
  ? { type: T }
  : { type: T; payload: P };

type Payloads =
  | PayloadAction<"addPlayer", { id: string; nickname: string }>
  | PayloadAction<
      "playCard",
      {
        playerId: string;
        index: number;
        destinationColor?: SolidColor;
        asMoney?: boolean;
      }
    >
  | PayloadAction<"flipHandCard", { playerId: string; index: number }>
  | PayloadAction<
      "flipPropertyCard",
      {
        playerId: string;
        index: number;
        color: SolidColor;
        destinationColor?: SolidColor;
      }
    >;

const reducer: Reducer<GameState, Payloads> = (state, action) => {
  switch (action.type) {
    case "addPlayer": {
      const { players = [], deck, messages } = state;
      const [playerHand, newDeck] = takeFirstN(
        deck.filter(({ type }) => type === "property"),
        17
      );
      const newPlayer: Player = {
        ...action.payload,
        hand: playerHand,
        properties: {},
        money: [],
      };
      return {
        ...state,
        players: [...players, newPlayer],
        deck: newDeck,
        messages: [
          ...messages,
          { id: "game", content: `${action.payload.nickname} has joined!` },
        ],
      };
    }
    case "playCard": {
      const { players, messages } = state;
      const { playerId, index, destinationColor, asMoney } = action.payload;
      let newPlayers = players;
      let newMessageContent = "";
      const currentPlayerIndex = players.findIndex(({ id }) => id === playerId);
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer) {
        console.error(`Unable to find player with id: ${playerId}`);
        return state;
      }
      const { hand, properties, money, nickname } = currentPlayer;
      const [newHand, card] = removeFromArray(hand, index);
      let newProperties = properties;
      let newMoney = money;
      switch (card.type) {
        case "property": {
          let color: SolidColor;
          if (card.color === "rainbow") {
            color = destinationColor as SolidColor;
          } else {
            color = Array.isArray(card.color) ? card.color[0] : card.color;
          }
          const pile = properties[color] ?? [];
          newProperties[color] = [...pile, card].sort(
            (cardA, cardB) => cardA.id - cardB.id
          );
          newMessageContent = `${nickname} played ${
            Array.isArray(card.color) || card.color === "rainbow"
              ? "wildcard"
              : "property"
          }`;
          break;
        }
        case "money": {
          newMoney = [...money, card];
          break;
        }
        // @ts-ignore
        case "action": {
          if (asMoney) {
            newMoney = [...money, card];
            break;
          }
        }
        case "rent": {
          if (asMoney) {
            newMoney = [...money, card];
            break;
          }
        }
      }
      const newPlayer: Player = {
        ...currentPlayer,
        hand: newHand,
        properties: newProperties,
        money: newMoney,
      };
      newPlayers = setValueInArray(newPlayers, currentPlayerIndex, newPlayer);
      return {
        ...state,
        players: newPlayers,
        messages: [...messages, { id: "game", content: newMessageContent }],
      };
    }
    case "flipHandCard": {
      const { players } = state;
      const { playerId, index } = action.payload;
      const currentPlayerIndex = players.findIndex(({ id }) => id === playerId);
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer) {
        console.error(`Unable to find player with id: ${playerId}`);
        return state;
      }
      const { hand } = currentPlayer;
      const oldCard = hand[index];
      if (oldCard.type !== "property" || !Array.isArray(oldCard.color)) {
        console.error(`Card at index ${index} is not a wildcard`);
        return state;
      }
      const newCard = {
        ...oldCard,
        color: [oldCard.color[1], oldCard.color[0]] as [SolidColor, SolidColor],
      };
      const newHand = setValueInArray(hand, index, newCard);
      const newPlayers = setValueInArray(players, currentPlayerIndex, {
        ...currentPlayer,
        hand: newHand,
      });
      return {
        ...state,
        players: newPlayers,
      };
    }
    case "flipPropertyCard": {
      const { players, messages } = state;
      const { playerId, index, color, destinationColor } = action.payload;
      const currentPlayerIndex = players.findIndex(({ id }) => id === playerId);
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer) {
        console.error(`Unable to find player with id: ${playerId}`);
        return state;
      }
      const { properties, nickname } = currentPlayer;
      const pile = properties[color] ?? [];
      const [newPileOldColor, card] = removeFromArray(pile, index);
      let newColor;
      if (Array.isArray(card.color)) {
        newColor = card.color[1];
      } else if (card.color === "rainbow") {
        newColor = destinationColor!;
      } else {
        console.error(`Card at index ${index} is not a wildcard`);
        return state;
      }
      let newPileNewColor = properties[newColor] ?? [];
      newPileNewColor = [
        ...newPileNewColor,
        {
          ...card,
          color: Array.isArray(card.color) ? [card.color[1], card.color[0]] : "rainbow",
        },
      ];
      newPileNewColor.sort((cardA, cardB) => cardA.id - cardB.id);
      const newProperties = {
        ...properties,
        [color]: newPileOldColor,
        [newColor]: newPileNewColor,
      };
      const newPlayers = setValueInArray(players, currentPlayerIndex, {
        ...currentPlayer,
        properties: newProperties,
      });
      return {
        ...state,
        players: newPlayers,
        messages: [...messages, { id: "game", content: `${nickname} flipped wildcard` }],
      };
    }
    default: {
      return state;
    }
  }
};

export default reducer;
