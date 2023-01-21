import { useLayoutEffect, useReducer, useState, useEffect, useRef } from "react";
import gameReducer, { colors, init, Player, SolidColor } from "./gameReducer";
import { Box, Button, Dialog, Divider, Typography } from "@mui/material";
import Card from "./Card";
import { colorToColor } from "./constants";
import Board from "./Board";

const clientId = "a";

const Game = () => {
  const [gameState, dispatch] = useReducer(gameReducer, init());
  const { players, messages, gameStarted } = gameState;

  const [chooseColorOptions, setChooseColorOptions] = useState<{
    properties: Player["properties"];
    onChoose: (color: SolidColor) => void;
  }>();

  const [scrolled, setScrolled] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!players.length) {
      dispatch({ type: "addPlayer", payload: { id: clientId, nickname: "player 1" } });
    }
  }, [players.length]);

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

  const thisPlayer = players.find(({ id }) => id === clientId);
  if (!thisPlayer) return <></>;

  if (!gameStarted)
    return <Button onClick={() => dispatch({ type: "startGame" })}>Start Game</Button>;

  const { id, hand = [], properties = {}, movesLeft: thisPlayerMovesLeft } = thisPlayer;
  const otherPlayers = players.filter(({ id }) => id !== clientId);
  const currentPlayerIndex = players.findIndex(
    ({ id }) => id === gameState.currentPlayerId
  );
  const {
    id: currentPlayerId,
    nickname: currentPlayerNickname,
    movesLeft,
  } = players[currentPlayerIndex];

  const isThisPlayersTurn = currentPlayerId === id;
  const moreThan7 = hand.length > 7;

  return (
    <Box padding={4}>
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
            {colors
              .filter(color => properties[color]?.length)
              .map((color, index) => (
                <Box
                  key={index}
                  className="perfect-center"
                  onClick={() => {
                    chooseColorOptions.onChoose(color);
                    setChooseColorOptions(undefined);
                  }}
                  sx={{
                    width: 100,
                    height: 100,
                    backgroundColor: colorToColor[color],
                    userSelect: "none",
                    color: "white",
                    borderRadius: 2,
                    cursor: "pointer",
                    // flex: "33%",
                  }}
                >
                  {color.replace("_", " ")}
                </Box>
              ))}
          </Box>
        </Dialog>
      )}
      <Board
        player={thisPlayer}
        // myBoard
        onFlip={(card, index, currentColor) => {
          if (card.type === "property" && card.color === "rainbow") {
            setChooseColorOptions({
              properties,
              onChoose: chosenColor =>
                dispatch({
                  type: "flipPropertyCard",
                  payload: {
                    playerId: id,
                    index,
                    color: currentColor,
                    destinationColor: chosenColor,
                  },
                }),
            });
          } else {
            dispatch({
              type: "flipPropertyCard",
              payload: {
                playerId: id,
                index,
                color: currentColor as SolidColor,
              },
            });
          }
        }}
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
        }}
      >
        <Box
          className="custom-scrollbar"
          ref={cardContainerRef}
          sx={{
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            height: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              height: "100%",
              flexShrink: 0,
              position: "sticky",
              top: 0,
              left: 0,
              zIndex: 3,
              backgroundColor: "grey.900",
              ...(scrolled && { boxShadow: "0px 0px 2px #333" }),
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: isThisPlayersTurn ? "space-between" : "center",
                paddingY: moreThan7 ? 4 : 5,
                maxWidth: 70,
              }}
            >
              <Box>
                <Typography
                  fontSize="10px"
                  color="primary.light"
                >{`${currentPlayerNickname} has ${movesLeft} move${
                  movesLeft === 1 ? "" : "s"
                } left`}</Typography>
                <Typography fontSize="8px" color="white">{`${
                  players[(currentPlayerIndex + 1) % players.length].nickname
                } is up next`}</Typography>
              </Box>
              {isThisPlayersTurn && (
                <Button
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
          <Box sx={{ display: "flex", alignItems: "center" }}>
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
                      if (!Object.entries(properties).some(([_, pile]) => pile?.length)) {
                        // Display alert that you can't play a rainbow without properties
                        return;
                      }
                      setChooseColorOptions({
                        properties,
                        onChoose: color => {
                          dispatch({
                            type: "playCard",
                            payload: { playerId: id, index, destinationColor: color },
                          });
                        },
                      });
                    } else {
                      dispatch({
                        type: "playCard",
                        payload: { playerId: id, index },
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
