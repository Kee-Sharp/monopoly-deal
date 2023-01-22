import { useState, useEffect, useRef } from "react";
import { colors, GameState, Payloads, Player, SolidColor } from "./gameReducer";
import { Box, Button, Dialog, Divider, Typography } from "@mui/material";
import Card from "./Card";
import { colorToColor } from "./constants";
import Board from "./Board";

interface GameProps {
  clientId: string;
  roomId: string;
  gameState: GameState;
  dispatch: (payload: Payloads) => Promise<void>;
}

const Game = ({ clientId, roomId, gameState, dispatch }: GameProps) => {
  const { players, messages, gameStarted } = gameState;

  const [copied, setCopied] = useState(false);

  const [chooseColorOptions, setChooseColorOptions] = useState<{
    properties: Player["properties"];
    onChoose: (color: SolidColor) => void;
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
  });

  const thisPlayer = players.find(({ id }) => id === clientId);
  if (!thisPlayer) return <></>;

  if (!gameStarted)
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

  const { id, hand = [], properties = {}, movesLeft: thisPlayerMovesLeft } = thisPlayer;
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

  return (
    <Box padding={4} paddingTop={2}>
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
                paddingY: moreThan7 ? 3 : 4,
                maxWidth: 70,
              }}
            >
              <Box>
                <Typography fontSize="10px" color="white" sx={{ marginBottom: 1 }}>
                  <span style={{ color: displayHex }}>{currentPlayerNickname}</span>
                  {` has ${movesLeft} move${movesLeft === 1 ? "" : "s"} left`}
                </Typography>
                <Typography fontSize="8px" color="white">
                  <span style={{ color: nextPlayer.displayHex }}>
                    {nextPlayer.nickname}
                  </span>
                  {` is up next`}
                </Typography>
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
