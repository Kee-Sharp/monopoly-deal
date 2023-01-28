import _ from "lodash";
import { Reducer } from "react";
import cards from "./cards.json";
import { colorToColor, defaultCardConfig } from "./constants";
import { removeFromArray, setValueInArray, sortCards, takeFirstN, updateFullSets } from "./utils";

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
export type PropertyCard = Extract<TCard, { type: "property" }>;
export type PropertyMap = Record<SolidColor, PropertyCard[]>;
export type FullSets = Partial<Record<SolidColor, boolean>>;

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
  rentModifier: number;
  setModifiers: Partial<Record<SolidColor, TCard[]>>;
  fullSets: FullSets;
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

type PayloadAction<T, P = undefined> = P extends undefined ? { type: T } : { type: T; payload: P };

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
        /** If there is a targeted player the action is just for them,
         * else it's for everyone
         */
        targetedPlayerId?: string;
        /** The index of the card to take an action against in the targeted player's properties */
        targetedIndex?: number;
        /** The index of the card to take action with in the current player's properties */
        ownIndex?: number;
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
      const color = colors.filter(color => color !== "black" && color !== "brown")[players.length];
      const newPlayer: Player = {
        ...action.payload,
        displayHex: colorToColor[color],
        hand: [],
        properties: [],
        money: [],
        movesLeft: 0,
        rentDue: null,
        rentModifier: 1,
        setModifiers: {},
        fullSets: {},
      };
      return {
        ...state,
        players: [...players, newPlayer],
        messages: [...messages, { id: "game", content: `${action.payload.nickname} has joined!` }],
      };
    }
    case "startGame": {
      const { players = [] } = state;
      if (players.length <= 1) return state;
      const shuffledPlayers = _.shuffle(players);
      const deck = _.shuffle(cards.flatMap(card => Array(defaultCardConfig[card.id]).fill(card)));
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
      const { deck, players, messages } = state;
      const {
        playerId,
        index,
        destinationColor,
        asMoney,
        targetedPlayerId,
        targetedIndex,
        ownIndex,
      } = action.payload;
      let newPlayers = players;
      let newMessageContent = "";
      const currentPlayerIndex = players.findIndex(({ id }) => id === playerId);
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer) {
        console.error(`Unable to find player with id: ${playerId}`);
        return state;
      }
      const {
        hand,
        properties = [],
        money = [],
        nickname,
        movesLeft,
        rentModifier,
        setModifiers = {},
        fullSets = {},
      } = currentPlayer;
      if (movesLeft === 0) return state;
      let newHand, card;
      [newHand, card] = removeFromArray(hand, index);
      let newProperties = properties;
      let newMoney = money;
      let rentModifierApplied = false;
      let newRentModifier = rentModifier;
      let amountToCharge = action.payload.amountToCharge ?? 0;
      let newDeck = deck;
      let newSetModifiers = setModifiers;
      switch (card.type) {
        case "property": {
          const newCard = destinationColor ? { ...card, actingColor: destinationColor } : card;
          newProperties = [...properties, newCard];
          newMessageContent = `${nickname} played ${
            Array.isArray(card.color) || card.color === "rainbow" ? "wildcard" : "property"
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
          if (!asMoney) {
            const targetedPlayerIndex = newPlayers.findIndex(({ id }) => id === targetedPlayerId);
            const targetedPlayer = newPlayers[targetedPlayerIndex];
            switch (card.id) {
              // deal breaker
              case 24: {
                if (!targetedPlayer || !destinationColor) return state;
                const [propertiesToTake, propertiesThatRemain] = targetedPlayer.properties.reduce<
                  [PropertyCard[], PropertyCard[]]
                >(
                  ([toTakeAcc, remainAcc], property) =>
                    [property.color, property.actingColor].includes(destinationColor)
                      ? [[...toTakeAcc, property], remainAcc]
                      : [toTakeAcc, [...remainAcc, property]],
                  [[], []]
                );
                newProperties = [...newProperties, ...propertiesToTake];
                newSetModifiers = {
                  ...newSetModifiers,
                  [destinationColor]: [
                    ...(newSetModifiers[destinationColor] ?? []),
                    ...(targetedPlayer.setModifiers?.[destinationColor] ?? []),
                  ],
                };
                newPlayers = setValueInArray(newPlayers, targetedPlayerIndex, {
                  ...targetedPlayer,
                  properties: propertiesThatRemain,
                  setModifiers: {
                    ...(targetedPlayer.setModifiers ?? {}),
                    [destinationColor]: [],
                  },
                });
                newMessageContent = `${nickname} took a full set from ${targetedPlayer.nickname}`;
                break;
              }
              // just say no
              case 25: {
                if (state.gameStarted && state.currentPlayerId === playerId) return state;
                break;
              }
              // sly deal
              case 26: {
                if (!targetedPlayer || !targetedIndex) return state;
                newProperties = [...newProperties, targetedPlayer.properties[targetedIndex]];
                newPlayers = setValueInArray(newPlayers, targetedPlayerIndex, {
                  ...targetedPlayer,
                  properties: targetedPlayer.properties.filter(
                    (_, index) => index !== targetedIndex
                  ),
                });
                newMessageContent = `${nickname} took a card from ${targetedPlayer.nickname}`;
                break;
              }
              // forced deal
              case 27: {
                if (!targetedPlayer || !targetedIndex || !ownIndex) return state;
                newProperties = [
                  ...newProperties.filter((_, index) => index !== ownIndex),
                  targetedPlayer.properties[targetedIndex],
                ];
                const newTargetedProperties = [
                  ...targetedPlayer.properties.filter((_, index) => index !== targetedIndex),
                  properties[ownIndex],
                ];
                newPlayers = setValueInArray(newPlayers, targetedPlayerIndex, {
                  ...targetedPlayer,
                  properties: newTargetedProperties,
                });
                newMessageContent = `${nickname} swapped cards with ${targetedPlayer.nickname}`;
                break;
              }
              // debt collector
              case 28: {
                amountToCharge = 5;
                break;
              }
              // hotel/house
              case 29:
              case 30: {
                if (!destinationColor || !fullSets[destinationColor]) return state;
                newSetModifiers = {
                  ...newSetModifiers,
                  [destinationColor]: [...(newSetModifiers[destinationColor] ?? []), card],
                };
                newMessageContent = `${nickname} played a set enhancement card`;
                break;
              }
              // it's my birthday
              case 31: {
                amountToCharge = 2;
                newMessageContent = `It's ${nickname}'s birthday`;
                break;
              }
              // double the rent
              case 32: {
                newRentModifier = newRentModifier * 2;
                newMessageContent = `${nickname} is doubling the rent`;
                break;
              }
              // pass go
              case 33: {
                let newCards;
                [newCards, newDeck] = takeFirstN(newDeck, 2);
                newHand = [...newHand, ...newCards];
                newMessageContent = `${nickname} passed go and drew 2 cards`;
                break;
              }
              default:
                return state;
            }
            if (!amountToCharge) break;
          }
          // fall through to the rent case
        }
        case "rent": {
          if (asMoney) {
            newMoney = [...money, card];
            break;
          } else if (amountToCharge) {
            const skipRentModifier = card.type === "action";
            newPlayers = newPlayers.map(player => {
              let rentDue: Player["rentDue"] = null;
              if (player.id === targetedPlayerId || (!targetedPlayerId && player.id !== playerId)) {
                rentDue = {
                  playerId,
                  amount: amountToCharge * (skipRentModifier ? 1 : rentModifier),
                };
              }
              return { ...player, rentDue };
            });
            newMessageContent = `${nickname} charged rent to ${
              targetedPlayerId
                ? players.find(({ id }) => id === targetedPlayerId)?.nickname ?? targetedPlayerId
                : "everyone"
            }`;
            rentModifierApplied = !skipRentModifier;
          } else return state;
        }
      }
      const newPlayer: Player = {
        ...newPlayers[currentPlayerIndex],
        hand: newHand,
        properties: newProperties,
        money: newMoney,
        movesLeft: movesLeft - 1,
        rentModifier: rentModifierApplied ? 1 : newRentModifier,
        setModifiers: newSetModifiers,
      };
      newPlayers = setValueInArray(newPlayers, currentPlayerIndex, newPlayer);
      newPlayers = newPlayers.map(player => {
        const properties = sortCards(player.properties ?? []);
        const fullSets = updateFullSets(properties);
        return { ...player, properties, fullSets };
      });
      return {
        ...state,
        deck: newDeck,
        players: newPlayers,
        messages: [
          ...messages,
          {
            id: "game",
            content: newMessageContent || `${nickname} played ${JSON.stringify(card)}`,
          },
        ],
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
      const { nickname, properties = [], money = [] } = currentPlayer;
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
      newPlayers = setValueInArray(newPlayers, playerChargingRentIndex, {
        ...rest,
        properties: [...chargingRentProperties, ...sendingProperties],
        money: [...chargingRentMoney, ...sendingMoney],
      });
      newPlayers = newPlayers.map(({ properties, ...rest }) => ({
        ...rest,
        properties,
        fullSets: updateFullSets(properties),
      }));
      return {
        ...state,
        players: newPlayers,
        messages: [...messages, { id: "game", content: `${nickname} paid rent` }],
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
      const { playerId, index, destinationColor } = action.payload;
      const currentPlayerIndex = players.findIndex(({ id }) => id === playerId);
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer) {
        console.error(`Unable to find player with id: ${playerId}`);
        return state;
      }
      const { properties, nickname, fullSets, setModifiers } = currentPlayer;
      const card = properties[index];
      const color = card.actingColor ?? (card.color as SolidColor);
      if (fullSets[color] && setModifiers[color]?.length) return state;
      const newProperties = [...properties];
      newProperties[index] = { ...properties[index], actingColor: destinationColor };
      const newPlayers = setValueInArray(players, currentPlayerIndex, {
        ...currentPlayer,
        properties: newProperties,
        fullSets: updateFullSets(newProperties),
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
        messages: [...messages, { id: "game", content: `${currentPlayer.nickname} ended turn` }],
        currentPlayerId: nextPlayer.id,
      };
    }
    default: {
      return state;
    }
  }
};

export default reducer;
