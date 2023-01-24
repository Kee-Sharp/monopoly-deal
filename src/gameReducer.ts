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
  | {
      type: "property";
      color: Color | [SolidColor, SolidColor];
      stages: number[];
      actingColor?: SolidColor;
    }
  | { type: "money" }
  | { type: "rent"; color: Color | [SolidColor, SolidColor]; description: string }
);
type PropertyCard = Extract<TCard, { type: "property" }>;

export interface Player {
  id: string;
  nickname: string;
  /** Used as this player's theme color */
  displayHex: string;
  hand: TCard[];
  properties: PropertyCard[];
  money: TCard[];
  movesLeft: number;
  rentDue: { playerId: string; amount: number } | null;
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
        amountToCharge?: number;
        /** If there is a targeted player the rent is just for them,
         * else charge rent to everyone
         */
        targetedPlayerId?: string;
      }
    >
  | PayloadAction<
      "payRent",
      {
        playerId: string;
        selectedProperties: (TCard | undefined)[];
        selectedMoney: (TCard | undefined)[];
      }
    >
  | PayloadAction<"flipHandCard", { playerId: string; index: number }>
  | PayloadAction<
      "flipPropertyCard",
      {
        playerId: string;
        index: number;
        destinationColor: SolidColor;
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
        properties: [],
        money: [],
        movesLeft: 0,
        rentDue: null,
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
      let newDeck = deck;
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
      const {
        playerId,
        index,
        destinationColor,
        asMoney,
        amountToCharge,
        targetedPlayerId,
      } = action.payload;
      let newPlayers = players;
      let newMessageContent = "";
      const currentPlayerIndex = players.findIndex(({ id }) => id === playerId);
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer) {
        console.error(`Unable to find player with id: ${playerId}`);
        return state;
      }
      const { hand, properties = [], money = [], nickname, movesLeft } = currentPlayer;
      if (movesLeft === 0) return state;
      const [newHand, card] = removeFromArray(hand, index);
      let newProperties = properties;
      let newMoney = money;
      switch (card.type) {
        case "property": {
          const newCard = destinationColor
            ? { ...card, actingColor: destinationColor }
            : card;
          newProperties = [...properties, newCard].sort(
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
        // @ts-ignore
        case "action": {
          if (!asMoney && !amountToCharge) {
            // do the action
            break;
          }
          // fall through to the rent case
        }
        case "rent": {
          if (asMoney) {
            newMoney = [...money, card];
            break;
          } else if (amountToCharge) {
            newPlayers = newPlayers.map(player => {
              let rentDue: Player["rentDue"] = null;
              if (
                player.id === targetedPlayerId ||
                (!targetedPlayerId && player.id !== playerId)
              ) {
                rentDue = { playerId, amount: amountToCharge };
              }
              return { ...player, rentDue };
            });
            newMessageContent = `${nickname} charged rent to ${
              targetedPlayerId
                ? players.find(({ id }) => id === targetedPlayerId)?.nickname ??
                  targetedPlayerId
                : "everyone"
            }`;
          } else return state;
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
    case "payRent": {
      const { players, messages } = state;
      const { playerId, selectedProperties, selectedMoney } = action.payload;
      const currentPlayerIndex = players.findIndex(({ id }) => id === playerId);
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer || !currentPlayer.rentDue) {
        console.error(`Unable to find player that has rent due with id: ${playerId}`);
        return state;
      }
      const { properties = [], money = [] } = currentPlayer;
      const playerChargingRentIndex = players.findIndex(
        ({ id }) => id === currentPlayer.rentDue?.playerId
      );
      const {
        properties: chargingRentProperties = [],
        money: chargingRentMoney = [],
        ...rest
      } = players[playerChargingRentIndex];

      const [remainingProperties, sendingProperties] = properties.reduce<
        [PropertyCard[], PropertyCard[]]
      >(
        ([remainingAcc, sendingAcc], property, index) =>
          selectedProperties[index]
            ? [remainingAcc, [...sendingAcc, property]]
            : [[...remainingAcc, property], sendingAcc],
        [[], []]
      );
      const [remainingMoney, sendingMoney] = money.reduce<[TCard[], TCard[]]>(
        ([remainingAcc, sendingAcc], bill, index) =>
          selectedMoney[index]
            ? [remainingAcc, [...sendingAcc, bill]]
            : [[...remainingAcc, bill], sendingAcc],
        [[], []]
      );
      let newPlayers = setValueInArray(players, currentPlayerIndex, {
        ...currentPlayer,
        properties: remainingProperties,
        money: remainingMoney,
        rentDue: null,
      });
      const newPropertiesForPlayerChargingRent = [
        ...chargingRentProperties,
        ...sendingProperties,
      ].sort((cardA, cardB) => cardA.id - cardB.id);
      newPlayers = setValueInArray(newPlayers, playerChargingRentIndex, {
        ...rest,
        properties: newPropertiesForPlayerChargingRent,
        money: [...chargingRentMoney, ...sendingMoney],
      });
      return { ...state, players: newPlayers, messages };
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
      const { playerId, index, destinationColor } = action.payload;
      const currentPlayerIndex = players.findIndex(({ id }) => id === playerId);
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer) {
        console.error(`Unable to find player with id: ${playerId}`);
        return state;
      }
      const { properties, nickname } = currentPlayer;
      const newProperties = [...properties];
      newProperties[index] = { ...properties[index], actingColor: destinationColor };
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
