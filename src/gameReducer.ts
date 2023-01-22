import _ from "lodash";
import { Reducer } from "react";
import cards from "./cards.json";
import { colorToColor, defaultCardConfig } from "./constants";
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
  /** Used as this player's theme color */
  displayHex: string;
  hand: TCard[];
  properties: { [color in SolidColor]?: Extract<TCard, { type: "property" }>[] };
  money: TCard[];
  movesLeft: number;
  rentDue?: { playerId: string; amount: number };
}
export type GameState = {
  players: Player[];
  deck: TCard[];
  messages: { id: string; content: string }[];
} & ({ gameStarted: false } | { gameStarted: true; currentPlayerId: string });

export const init = (): GameState => {
  return {
    players: [],
    deck: [],
    messages: [{ id: "game", content: "Game created" }],
    gameStarted: false,
  };
};

type PayloadAction<T, P = undefined> = P extends undefined
  ? { type: T }
  : { type: T; payload: P };

export type Payloads =
  | PayloadAction<"addPlayer", { id: string; nickname: string }>
  | PayloadAction<"startGame">
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
    >
  | PayloadAction<"endTurn", number>;

const reducer: Reducer<GameState, Payloads> = (state, action) => {
  switch (action.type) {
    case "addPlayer": {
      const { players = [], messages } = state;
      const color = colors.filter(color => color !== "black" && color !== "brown")[
        players.length
      ];
      const newPlayer: Player = {
        ...action.payload,
        displayHex: colorToColor[color],
        hand: [],
        properties: {},
        money: [],
        movesLeft: 0,
      };
      return {
        ...state,
        players: [...players, newPlayer],
        messages: [
          ...messages,
          { id: "game", content: `${action.payload.nickname} has joined!` },
        ],
      };
    }
    case "startGame": {
      const { players = [] } = state;
      if (players.length <= 1) return state;
      const shuffledPlayers = _.shuffle(players);
      const deck = _.shuffle(
        cards.flatMap(card => Array(defaultCardConfig[card.id]).fill(card))
      );
      let newDeck = deck.filter(({ type }) => ["money", "property"].includes(type));
      const newPlayers = shuffledPlayers.map((player, index) => {
        let hand;
        [hand, newDeck] = takeFirstN(newDeck, index === 0 ? 7 : 5);
        return { ...player, hand };
      });
      newPlayers[0].movesLeft = 3;
      return {
        ...state,
        players: newPlayers,
        deck: newDeck,
        gameStarted: true,
        currentPlayerId: newPlayers[0].id,
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
      const { hand, properties = {}, money = [], nickname, movesLeft } = currentPlayer;
      if (movesLeft === 0) return state;
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
          newMessageContent = `${nickname} played money`;
          break;
        }
        case "action": {
          if (asMoney) {
            newMoney = [...money, card];
            break;
          }
          break;
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
        movesLeft: movesLeft - 1,
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
      const { properties = {}, nickname } = currentPlayer;
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
      if (newColor === color) return state;
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
    case "endTurn": {
      const { players, deck, messages } = state;
      const currentPlayerIndex = action.payload;
      const currentPlayer = players[action.payload];
      const newPlayers = [...players];
      newPlayers[currentPlayerIndex] = { ...currentPlayer, movesLeft: 0 };
      const [twoCards, newDeck] = takeFirstN(deck, 2);
      const nextIndex = (currentPlayerIndex + 1) % players.length;
      const nextPlayer = newPlayers[nextIndex];
      newPlayers[nextIndex] = {
        ...nextPlayer,
        hand: [...nextPlayer.hand, ...twoCards],
        movesLeft: 3,
      };
      return {
        ...state,
        deck: newDeck,
        players: newPlayers,
        messages: [
          ...messages,
          { id: "game", content: `${currentPlayer.nickname} ended turn` },
        ],
        currentPlayerId: nextPlayer.id,
      };
    }
    default: {
      return state;
    }
  }
};

export default reducer;
