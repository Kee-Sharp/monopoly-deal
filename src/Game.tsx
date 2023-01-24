import { useState, useEffect, useRef } from "react";
import { colors, GameState, Payloads, Player, SolidColor, TCard } from "./gameReducer";
import { Box, Button, Dialog, Divider, Typography } from "@mui/material";
import Card from "./Card";
import { colorToColor, stagesMap } from "./constants";
import Board from "./Board";
import { useToggle } from "./hooks";

interface GameProps {
  clientId: string;
  roomId: string;
  gameState: GameState;
  dispatch: (payload: Payloads) => Promise<void>;
}
interface ColorOptions {
  color: SolidColor;
  amountInSet: number;
}

const Game = ({ clientId, roomId, gameState, dispatch }: GameProps) => {
  const { players, messages, gameStarted } = gameState;

  const [copied, setCopied] = useState(false);

  const [chooseColorOptions, setChooseColorOptions] = useState<{
    colorOptions: ColorOptions[];
    isRent?: boolean;
    onChoose: (color: SolidColor) => void;
  }>();
  const [selectedProperties, toggleSelectedProperties] = useToggle<TCard>();
  const [selectedMoney, toggleSelectedMoney] = useToggle<TCard>();

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
  });

  const playersMap = players.reduce<Record<string, Player>>(
    (map, player) => ({ ...map, [player.id]: player }),
    {}
  );

  const thisPlayer = playersMap[clientId];
  if (!thisPlayer) return <></>;

  if (!gameStarted) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          margin: 4,
        }}
      >
        <Box sx={{ display: "flex", marginBottom: 4, alignItems: "center" }}>
          <Typography sx={{ color: "white" }}>code:</Typography>
          <Typography
            sx={{
              backgroundColor: "grey.900",
              border: "2px solid",
              borderColor: "primary.main",
              borderRadius: 2,
              padding: 1,
              color: "primary.main",
              position: "relative",
              marginLeft: 2,
              cursor: "pointer",
            }}
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              setCopied(true);
            }}
          >
            {roomId}
            <Typography
              sx={{ position: "absolute", fontSize: 10, right: 0, top: -16 }}
              component="span"
              color={copied ? "primary.main" : "white"}
            >
              {copied ? "copied!" : "click to copy"}
            </Typography>
          </Typography>
        </Box>
        <Typography color="white">Friends who have joined</Typography>
        {players.map(({ id, displayHex, nickname }) => (
          <Typography key={id} sx={{ color: displayHex }}>
            {nickname}
          </Typography>
        ))}
        <Button
          variant="contained"
          onClick={() => dispatch({ type: "startGame" })}
          sx={{ marginTop: 4 }}
          disabled={players.length <= 1}
        >
          Start Game
        </Button>
      </Box>
    );
  }

  const {
    id,
    hand = [],
    properties = [],
    money = [],
    movesLeft: thisPlayerMovesLeft,
    rentDue,
  } = thisPlayer;

  const propertiesMap = properties.reduce((map, property) => {
    const color = property.actingColor ?? (property.color as SolidColor);
    return { ...map, [color]: [...(map[color] ?? []), property] };
  }, {} as Record<SolidColor, Player["properties"][number][]>);
  const allColorOptions = Object.entries(propertiesMap).map<ColorOptions>(
    ([color, { length }]) => ({ color: color as SolidColor, amountInSet: length })
  );

  const otherPlayers = players.filter(({ id }) => id !== clientId);
  const currentPlayerIndex = players.findIndex(
    ({ id }) => id === gameState.currentPlayerId
  );
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
  const playerChargingRent = playerChargingRentId
    ? playersMap[playerChargingRentId]
    : undefined;
  const totalSelected = [...selectedMoney, ...selectedProperties].reduce(
    (total, card) => total + (card?.value ?? 0),
    0
  );
  const isBroke = properties.length === 0 && money.length === 0;
  const allSelected = [properties, money].every((arr, isMoney) =>
    arr.every((_, index) => (isMoney ? selectedMoney[index] : selectedProperties[index]))
  );
  const canPayRent = totalSelected >= (rentDue?.amount ?? 0) || isBroke || allSelected;

  return (
    <Box padding={4} paddingTop={2}>
      {rentDue && (
        <Dialog open sx={{ ".MuiPaper-root": { backgroundColor: "grey.900" } }}>
          <Box
            sx={{
              padding: 2,
              borderRadius: 2,
              backgroundColor: "grey.900",
              border: `2px solid ${playerChargingRent?.displayHex}`,
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 2,
                gap: 1,
              }}
            >
              <Typography sx={{ color: "white" }}>
                You owe{" "}
                <span style={{ color: playerChargingRent?.displayHex }}>
                  {rentDue.amount}M
                </span>{" "}
                in rent to{" "}
                <span style={{ color: playerChargingRent?.displayHex }}>
                  {playerChargingRent?.nickname}
                </span>
              </Typography>
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
            </Box>
            <Box
              className="custom-scrollbar"
              sx={{ display: "flex", overflowX: "auto", gap: 0.5 }}
            >
              {properties.map((property, index) => (
                <Card
                  key={`property-${index}`}
                  card={property}
                  canFlip={false}
                  onClick={() => toggleSelectedProperties(index, property)}
                  sx={{
                    flexShrink: 0,
                    zoom: 0.9,
                    ":hover": {},
                    ...(!!selectedProperties[index] && {
                      color: "red",
                      "&::after": {
                        content: "''",
                        backgroundColor: "rgb(33,173,153)",
                        opacity: "0.8",
                        position: "absolute",
                        inset: "0px",
                        zIndex: 4,
                      },
                    }),
                  }}
                />
              ))}
            </Box>
            <Box
              className="custom-scrollbar"
              sx={{ display: "flex", overflowX: "auto", gap: 0.5, marginY: 1 }}
            >
              {money.map((moneyCard, index) => (
                <Card
                  key={`moneyCard-${index}`}
                  card={moneyCard}
                  canFlip={false}
                  onClick={() => toggleSelectedMoney(index, moneyCard)}
                  sx={{
                    flexShrink: 0,
                    zoom: 0.9,
                    ":hover": {},
                    ...(!!selectedMoney[index] && {
                      "&::after": {
                        content: "''",
                        backgroundColor: "rgb(33,173,153)",
                        opacity: "0.8",
                        position: "absolute",
                        inset: "0px",
                        zIndex: 4,
                      },
                    }),
                  }}
                />
              ))}
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                paddingTop: 2,
                gap: 0.5,
              }}
            >
              <Button
                className={canPayRent ? "" : "disabled"}
                color="success"
                variant="contained"
                sx={{ fontSize: 10 }}
                onClick={() =>
                  dispatch({
                    type: "payRent",
                    payload: { playerId: id, selectedProperties, selectedMoney },
                  })
                }
              >
                Pay Rent
              </Button>
              <Button
                className="disabled"
                color="error"
                variant="contained"
                sx={{ fontSize: 10 }}
              >
                Use Just Say No!
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
      {chooseColorOptions && (
        <Dialog
          open
          sx={{ borderRadius: 4 }}
          onClose={() => setChooseColorOptions(undefined)}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              padding: 4,
              backgroundColor: "grey.900",
              gap: 1,
            }}
          >
            {chooseColorOptions.colorOptions.map(({ color, amountInSet }, index) => (
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
                {chooseColorOptions.isRent && (
                  <Typography>
                    {stagesMap[color][
                      Math.min(amountInSet - 1, stagesMap[color].length - 1)
                    ] ?? 0}
                    M
                  </Typography>
                )}
              </Box>
            ))}
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
                destinationColor: card.color.filter(
                  color => color !== card.actingColor
                )[0],
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
                <Typography fontSize="10px" color="white" sx={{ marginBottom: 1 }}>
                  <span style={{ color: displayHex }}>{currentPlayerNickname}</span>
                  {` has ${movesLeft} move${movesLeft === 1 ? "" : "s"} left`}
                </Typography>
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
                <Typography fontSize="8px" color="white">
                  <span style={{ color: nextPlayer.displayHex }}>
                    {nextPlayer.nickname}
                  </span>
                  {` is up next`}
                </Typography>
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
            ></Divider>
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
                    } else if (card.type === "rent") {
                      const options = Array.isArray(card.color)
                        ? card.color.reduce<ColorOptions[]>(
                            (acc, color) => [
                              ...acc,
                              { color, amountInSet: propertiesMap[color]?.length ?? 0 },
                            ],
                            []
                          )
                        : allColorOptions;
                      setChooseColorOptions({
                        colorOptions: options,
                        isRent: true,
                        onChoose: color => {
                          const amountOfPropertiesInSet = (propertiesMap[color] ?? [])
                            .length;
                          const amountToCharge = amountOfPropertiesInSet
                            ? stagesMap[color][
                                Math.min(
                                  amountOfPropertiesInSet - 1,
                                  stagesMap[color].length - 1
                                )
                              ]
                            : 0;
                          dispatch({
                            type: "playCard",
                            payload: { playerId: id, index, amountToCharge },
                          });
                        },
                      });
                    } else {
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
