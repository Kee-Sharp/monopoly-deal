import { useState, useEffect, useRef } from "react";
import { GameState, Payloads, Player, SolidColor, TCard } from "./gameReducer";
import { Box, Button, Dialog, Divider, Typography } from "@mui/material";
import Card from "./Card";
import { colorToColor, stagesMap } from "./constants";
import Board from "./Board";
import { useToggle } from "./hooks";
import { createPropertyMap } from "./utils";
import ChooseCards, { ChooseCardsProps } from "./ChooseCards";
import ColoredText from "./ColoredText";

interface GameProps {
  clientId: string;
  gameState: GameState;
  dispatch: (payload: Payloads) => Promise<void>;
}
interface ColorOptions {
  color: SolidColor;
  amountInSet: number;
}

const Game = ({ clientId, gameState, dispatch }: GameProps) => {
  const { players, messages, gameStarted } = gameState;

  const [chooseColorOptions, setChooseColorOptions] = useState<{
    colorOptions: ColorOptions[];
    isRent?: boolean;
    onChoose: (color: SolidColor) => void;
  }>();
  const [selectedProperties, toggleSelectedProperties, setSelectedProperties] = useToggle();
  /** Other cards can be other properties or our own money */
  const [selectedOtherCards, toggleSelectedOtherCards, setSelectedOtherCards] = useToggle();
  const [choosePlayer, setChoosePlayer] = useState<{
    onChoose: (targetedPlayerId: string) => void;
  }>();
  const [chooseCards, setChooseCards] = useState<ChooseCardsProps>();

  const [chooseActionOrMoney, setChooseActionOrMoney] = useState<{
    action: () => void;
    money: () => void;
  }>();

  const [scrolled, setScrolled] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(messages.at(-1)?.content);
  }, [messages, messages.length]);

  useEffect(() => {
    const cardContainer = cardContainerRef.current;
    const handleScroll = () => {
      setScrolled((cardContainer?.scrollLeft ?? 0) > 0);
    };
    cardContainer?.addEventListener("scroll", handleScroll);
    return () => cardContainer?.removeEventListener("scroll", handleScroll);
  }, []);

  const playersMap = players.reduce<Record<string, Player>>(
    (map, player) => ({ ...map, [player.id]: player }),
    {}
  );

  const thisPlayer = playersMap[clientId];
  if (!thisPlayer || !gameStarted) return <></>;

  const {
    id,
    hand = [],
    properties = [],
    money = [],
    movesLeft: thisPlayerMovesLeft,
    rentDue,
    setModifiers,
    fullSets,
  } = thisPlayer;

  const propertiesMap = createPropertyMap(properties);
  const allColorOptions = Object.entries(propertiesMap).map<ColorOptions>(
    ([color, { length }]) => ({ color: color as SolidColor, amountInSet: length })
  );

  const otherPlayers = players.filter(({ id }) => id !== clientId);
  const currentPlayerIndex = players.findIndex(({ id }) => id === gameState.currentPlayerId);
  const {
    id: currentPlayerId,
    nickname: currentPlayerNickname,
    displayHex,
    movesLeft,
  } = players[currentPlayerIndex];

  const isThisPlayersTurn = currentPlayerId === id;
  const moreThan7 = hand.length > 7;
  const nextPlayer = players[(currentPlayerIndex + 1) % players.length];
  const playersWithRent = players.filter(({ rentDue }) => !!rentDue);
  const playerChargingRentId = playersWithRent[0]?.rentDue?.playerId;
  const playerChargingRent = playerChargingRentId ? playersMap[playerChargingRentId] : undefined;
  const totalSelected = [...selectedOtherCards, ...selectedProperties].reduce(
    (total, card) => total + (card?.value ?? 0),
    0
  );
  const allSelected = [properties, money].every((arr, isMoney) =>
    arr.every((_, index) => (isMoney ? selectedOtherCards[index] : selectedProperties[index]))
  );
  const canPayRent = totalSelected >= (rentDue?.amount ?? 0) || allSelected;

  const closeChooseCards = () => {
    setChooseCards(undefined);
    setSelectedProperties([]);
    setSelectedOtherCards([]);
  };

  //  eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (rentDue) {
      setChooseCards({
        player: thisPlayer,
        title: (
          <>
            {/* <Typography sx={{ color: "white" }}>
              You owe{" "}
              <span style={{ color: playerChargingRent?.displayHex }}>{rentDue.amount}M</span> in
              rent to{" "}
              <span style={{ color: playerChargingRent?.displayHex }}>
                {playerChargingRent?.nickname}
              </span>
            </Typography> */}
            <ColoredText
              sentence={`You owe ${rentDue.amount}M in rent to ${playerChargingRent?.nickname}`}
              coloredWords={[`${rentDue.amount}M`, playerChargingRent?.nickname ?? ""]}
              color={playerChargingRent?.displayHex ?? "primary.main"}
            />
            <Box
              className="perfect-center"
              sx={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: canPayRent ? "lightgreen" : "coral",
                color: canPayRent ? "black" : "white",
                fontWeight: "medium",
                fontSize: 12,
              }}
            >
              {totalSelected}M
            </Box>
          </>
        ),
        onClickProperty: (property, index) => toggleSelectedProperties(index, property),
        otherCards: money,
        onClickOtherCard: (moneyCard, index) => toggleSelectedOtherCards(index, moneyCard),
        isSet: false,
        primaryAction: {
          label: "Pay Rent",
          action: () => {
            dispatch({
              type: "payRent",
              payload: { playerId: id, selectedProperties, selectedMoney: selectedOtherCards },
            });
            closeChooseCards();
          },
          disabled: !canPayRent,
        },
        secondaryAction: {
          label: "Use Just Say No!",
          action: () => {
            closeChooseCards();
          },
          disabled: true,
        },
        skipFullSetFilter: true,
        borderColor: playerChargingRent?.displayHex,
      });
    } else {
      setChooseCards(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentDue, totalSelected, canPayRent]);

  const playActionOrRentCard = (card: TCard, index: number) => {
    const playCard = (
      otherOptions: Partial<Extract<Payloads, { type: "playCard" }>["payload"]> = {}
    ) => {
      dispatch({ type: "playCard", payload: { playerId: id, index, ...otherOptions } });
    };
    if (card.type === "rent") {
      const playRentCard = (targetedPlayerId?: string) => (color: SolidColor) => {
        const amountOfPropertiesInSet = (propertiesMap[color] ?? []).length;
        const modifiersForColor = fullSets[color]
          ? setModifiers[color]?.reduce((total, { value }) => total + value, 0) ?? 0
          : 0;
        const amountToCharge = amountOfPropertiesInSet
          ? stagesMap[color][Math.min(amountOfPropertiesInSet - 1, stagesMap[color].length - 1)] +
            modifiersForColor
          : 0;
        playCard({
          amountToCharge,
          targetedPlayerId,
        });
      };
      if (Array.isArray(card.color)) {
        const options = card.color.reduce<ColorOptions[]>(
          (acc, color) => [...acc, { color, amountInSet: propertiesMap[color]?.length ?? 0 }],
          []
        );
        setChooseColorOptions({
          colorOptions: options,
          isRent: true,
          onChoose: playRentCard(),
        });
      } else {
        setChoosePlayer({
          onChoose: playerId => {
            setChooseColorOptions({
              colorOptions: allColorOptions,
              isRent: true,
              onChoose: playRentCard(playerId),
            });
          },
        });
      }
    } else {
      switch (card.id) {
        // deal breaker
        case 24:
          setChoosePlayer({
            onChoose: targetedPlayerId => {
              const targetedPlayer = playersMap[targetedPlayerId];
              setChooseCards({
                player: targetedPlayer,
                title: (
                  <ColoredText
                    sentence="Click one full set in order to steal"
                    coloredWords={["full set", "steal"]}
                    color={targetedPlayer.displayHex}
                  />
                ),
                //   title: (<Typography sx={{ color: "white" }}>
                //   Click one{" "}
                //   <span style={{ color: targetedPlayer.displayHex }}>
                //     full set
                //   </span>{" "}
                //   in order to{" "}
                //   <span style={{ color: targetedPlayer.displayHex }}>
                //     steal
                //   </span>
                // </Typography>),
                onChoose: color => {
                  playCard({ targetedPlayerId, destinationColor: color });
                  closeChooseCards();
                },
                isSet: true,
                secondaryAction: {
                  label: "Undo",
                  action: closeChooseCards,
                },
              });
            },
          });
          break;
        // sly deal
        case 26:
          setChoosePlayer({
            onChoose: targetedPlayerId => {
              const targetedPlayer = playersMap[targetedPlayerId];
              setChooseCards({
                player: targetedPlayer,
                title: (
                  <ColoredText
                    sentence={`Select one of ${targetedPlayer.nickname}'s cards to take`}
                    coloredWords={[`${targetedPlayer.nickname}'s`]}
                    color={targetedPlayer.displayHex}
                  />
                ),
                onClickProperty: (_, index) => {
                  const newArray = [];
                  newArray[index] = true;
                  setSelectedProperties(newArray);
                },
                isSet: false,
                primaryAction: {
                  label: "Take Card",
                  action: selectedProperties => {
                    const targetedIndex = selectedProperties.findIndex(val => val);
                    playCard({ targetedPlayerId, targetedIndex });
                    closeChooseCards();
                  },
                },
                secondaryAction: {
                  label: "Undo",
                  action: closeChooseCards,
                },
              });
            },
          });
          break;
        // forced deal
        case 27:
          setChoosePlayer({
            onChoose: targetedPlayerId => {
              const targetedPlayer = playersMap[targetedPlayerId];
              setChooseCards({
                player: targetedPlayer,
                title: (
                  <ColoredText
                    sentence={`Select one of ${targetedPlayer.nickname}'s cards to take`}
                    coloredWords={[`${targetedPlayer.nickname}'s`]}
                    color={targetedPlayer.displayHex}
                  />
                ),
                onClickProperty: (_, index) => {
                  const newArray = [];
                  newArray[index] = true;
                  setSelectedProperties(newArray);
                },
                otherTitle: (
                  <ColoredText
                    sentence="Select one of Your cards to give"
                    coloredWords={["Your"]}
                    color={targetedPlayer.displayHex}
                  />
                ),
                otherCards: properties,
                onClickOtherCard: (_, index) => {
                  const newArray = [];
                  newArray[index] = true;
                  setSelectedOtherCards(newArray);
                },
                isSet: false,
                primaryAction: {
                  label: "Swap",
                  action: (selectedProperties, selectedOtherCards) => {
                    const targetedIndex = selectedProperties.findIndex(val => val);
                    const ownIndex = selectedOtherCards.findIndex(val => val);
                    playCard({ targetedPlayerId, targetedIndex, ownIndex });
                    closeChooseCards();
                  },
                },
                secondaryAction: {
                  label: "Undo",
                  action: closeChooseCards,
                },
              });
            },
          });
          break;
        case 28:
          setChoosePlayer({
            onChoose: targetedPlayerId => playCard({ targetedPlayerId }),
          });
          break;
        case 29:
        case 30:
          setChooseCards({
            player: thisPlayer,
            title: (
              <Typography color="white">{`Choose a set to add this ${
                card.id === 30 ? "House" : "Hotel"
              } to`}</Typography>
            ),
            //   title: (<Typography sx={{ color: "white" }}>
            //   Click one{" "}
            //   <span style={{ color: targetedPlayer.displayHex }}>
            //     full set
            //   </span>{" "}
            //   in order to{" "}
            //   <span style={{ color: targetedPlayer.displayHex }}>
            //     steal
            //   </span>
            // </Typography>),
            secondaryAction: {
              label: "Undo",
              action: closeChooseCards,
            },
            onChoose: color => {
              playCard({ destinationColor: color });
              setChooseCards(undefined);
            },
            isSet: true,
          });
          break;
        default:
          playCard();
      }
    }
  };

  return (
    <Box padding={4} paddingTop={2}>
      {chooseCards && (
        <ChooseCards
          {...chooseCards}
          selectedProperties={selectedProperties}
          selectedOtherCards={selectedOtherCards}
        />
      )}
      {chooseColorOptions && (
        <Dialog open sx={{ borderRadius: 4 }} onClose={() => setChooseColorOptions(undefined)}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              padding: 4,
              backgroundColor: "grey.900",
              gap: 1,
            }}
          >
            {chooseColorOptions.colorOptions.map(({ color, amountInSet }, index) => {
              const modifiersForColor = fullSets[color]
                ? setModifiers[color]?.reduce((total, { value }) => total + value, 0) ?? 0
                : 0;
              const amountToCharge = amountInSet
                ? stagesMap[color][Math.min(amountInSet - 1, stagesMap[color].length - 1)] +
                  modifiersForColor
                : 0;
              return (
                <Box
                  key={index}
                  className="perfect-center"
                  onClick={() => {
                    chooseColorOptions.onChoose(color);
                    setChooseColorOptions(undefined);
                  }}
                  sx={{
                    flexDirection: "column",
                    width: 100,
                    height: 100,
                    backgroundColor: colorToColor[color],
                    userSelect: "none",
                    color: "white",
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                >
                  <Typography>{color.replace("_", " ")}</Typography>
                  {chooseColorOptions.isRent && <Typography>{amountToCharge}M</Typography>}
                </Box>
              );
            })}
          </Box>
        </Dialog>
      )}
      {chooseActionOrMoney && (
        <Dialog open sx={{ ".MuiPaper-root": { borderRadius: 2 } }}>
          <Box
            sx={{
              backgroundColor: "grey.900",
              borderRadius: 2,
              border: "2px solid",
              borderColor: "primary.main",
              padding: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <ColoredText
              sentence="You have some options"
              coloredWords={["options"]}
              color="primary.main"
            />
            <ColoredText
              sentence="The card you're playing can be used as an action card, or played as if it were just money"
              coloredWords={["action card", "money"]}
              color="primary.main"
              sx={{ fontSize: 10 }}
            />
            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
              <Button
                variant="contained"
                color="success"
                sx={{ fontSize: 8 }}
                onClick={chooseActionOrMoney.action}
              >
                Play As Action
              </Button>
              <Button
                variant="contained"
                color="success"
                sx={{ fontSize: 8 }}
                onClick={chooseActionOrMoney.money}
              >
                Play As Money
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{ fontSize: 8 }}
                onClick={() => setChooseActionOrMoney(undefined)}
              >
                Undo
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
      <Box
        className="custom-scrollbar"
        sx={{ display: "flex", overflowX: "auto", paddingBottom: 0.75 }}
      >
        {otherPlayers.map(otherPlayer => (
          <Board
            key={otherPlayer.id}
            player={otherPlayer}
            sx={{ zoom: 0.7, marginRight: 1, flexShrink: 0 }}
            onClick={({ id }) => {
              choosePlayer?.onChoose(id);
              setChoosePlayer(undefined);
            }}
          />
        ))}
      </Box>
      <Board
        player={thisPlayer}
        myBoard
        isTurn={isThisPlayersTurn}
        onFlip={(card, index) => {
          if (card.type === "property" && card.color === "rainbow") {
            setChooseColorOptions({
              colorOptions: allColorOptions,
              onChoose: chosenColor =>
                dispatch({
                  type: "flipPropertyCard",
                  payload: {
                    playerId: id,
                    index,
                    destinationColor: chosenColor,
                  },
                }),
            });
          } else if (card.type === "property" && Array.isArray(card.color)) {
            dispatch({
              type: "flipPropertyCard",
              payload: {
                playerId: id,
                index,
                destinationColor: card.color.filter(color => color !== card.actingColor)[0],
              },
            });
          }
        }}
        sx={{ marginTop: 1 }}
      />
      {/* Hand Section */}
      <Box
        sx={{
          backgroundColor: "grey.900",
          marginTop: 3,
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          paddingX: 1.5,
          paddingY: 1,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          boxShadow: 2,
          overflowX: "hidden",
          zIndex: 3,
        }}
      >
        <Box
          className="custom-scrollbar"
          ref={cardContainerRef}
          sx={{
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            overscrollBehaviorX: "none",
            height: "100%",
          }}
        >
          {/* Game Info */}
          <Box
            sx={{
              display: "flex",
              height: "100%",
              flexShrink: 0,
              position: "sticky",
              top: 0,
              left: 0,
              zIndex: 4,
              backgroundColor: "grey.900",
              ...(scrolled && { boxShadow: "0px 0px 2px #333" }),
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: isThisPlayersTurn ? "space-between" : "center",
                paddingY: moreThan7 ? 3 : 4,
                maxWidth: 70,
              }}
            >
              <Box>
                {/* <Typography fontSize="10px" color="white" sx={{ marginBottom: 1 }}>
                  <span style={{ color: displayHex }}>{currentPlayerNickname}</span>
                  {` has ${movesLeft} move${movesLeft === 1 ? "" : "s"} left`}
                </Typography> */}
                <ColoredText
                  sentence={`${currentPlayerNickname} has ${movesLeft} move${
                    movesLeft === 1 ? "" : "s"
                  } left`}
                  coloredWords={[currentPlayerNickname]}
                  color={displayHex}
                  sx={{ fontSize: 10, marginBottom: 1 }}
                />
                {!!playersWithRent.length && (
                  <Typography fontSize="10px" color="white" sx={{ marginBottom: 1 }}>
                    <Typography
                      fontSize="10px"
                      fontWeight="bold"
                      component="span"
                      color="error.main"
                    >{`${playersWithRent.length} player${
                      playersWithRent.length === 1 ? "" : "s"
                    } `}</Typography>
                    {`need${playersWithRent.length === 1 ? "s" : ""} to pay RENT`}
                  </Typography>
                )}
                <ColoredText
                  sentence={`${nextPlayer.nickname} is up next`}
                  coloredWords={[nextPlayer.nickname]}
                  color={nextPlayer.displayHex}
                  sx={{ fontSize: 8 }}
                />
                {/* <Typography fontSize="8px" color="white">
                  <span style={{ color: nextPlayer.displayHex }}>
                    {nextPlayer.nickname}
                  </span>
                  {` is up next`}
                </Typography> */}
              </Box>
              {isThisPlayersTurn && (
                <Button
                  className={playerChargingRentId === id ? "disabled" : ""}
                  color="error"
                  variant="contained"
                  sx={{ fontSize: 8 }}
                  onClick={() => {
                    if (moreThan7) console.log("has more than 7");
                    dispatch({ type: "endTurn", payload: currentPlayerIndex });
                  }}
                >
                  {moreThan7 ? "Discard and End Turn" : "End Turn"}
                </Button>
              )}
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ backgroundColor: "white", marginX: 1.5, marginY: 2 }}
            />
          </Box>
          {/* Cards in Hand */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginLeft: 1,
              ...(playerChargingRentId === id && { opacity: 0.2 }),
            }}
          >
            {hand.map((card, index) => {
              return (
                <Card
                  key={`${card.id}-${index}`}
                  card={card}
                  onFlip={() =>
                    dispatch({
                      type: "flipHandCard",
                      payload: { playerId: id, index },
                    })
                  }
                  onClick={card => {
                    if (!thisPlayerMovesLeft) return;
                    if (card.type === "property" && card.color === "rainbow") {
                      if (!properties.length) {
                        // Display alert that you can't play a rainbow without properties
                        return;
                      }
                      setChooseColorOptions({
                        colorOptions: allColorOptions,
                        onChoose: color => {
                          dispatch({
                            type: "playCard",
                            payload: { playerId: id, index, destinationColor: color },
                          });
                        },
                      });
                    } else if (card.type === "property" || card.type === "money") {
                      dispatch({
                        type: "playCard",
                        payload: {
                          playerId: id,
                          index,
                          destinationColor:
                            card.type === "property" && Array.isArray(card.color)
                              ? card.color[0]
                              : undefined,
                        },
                      });
                    } else {
                      setChooseActionOrMoney({
                        action: () => {
                          playActionOrRentCard(card, index);
                          setChooseActionOrMoney(undefined);
                        },
                        money: () => {
                          dispatch({
                            type: "playCard",
                            payload: { playerId: id, index, asMoney: true },
                          });
                          setChooseActionOrMoney(undefined);
                        },
                      });
                    }
                  }}
                  sx={{
                    ":not(:first-of-type)": { marginLeft: "calc(-1 * var(--size)*0.72)" },
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Game;
