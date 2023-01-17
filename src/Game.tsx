import { useLayoutEffect, useReducer, useState, useEffect } from "react";
import gameReducer, { colors, init, Player, SolidColor } from "./gameReducer";
import { Box, Dialog } from "@mui/material";
import Card from "./Card";
import { colorToColor } from "./constants";

const Game = () => {
  const [gameState, dispatch] = useReducer(gameReducer, init());
  const { players } = gameState;

  const [chooseColorOptions, setChooseColorOptions] = useState<{
    properties: Player["properties"];
    onChoose: (color: SolidColor) => void;
  }>();

  useLayoutEffect(() => {
    if (!players.length) {
      dispatch({ type: "addPlayer", payload: { id: "a", nickname: "player 1" } });
    }
  }, []);

  useEffect(() => {
    console.log(gameState.messages.at(-1)?.content);
  }, [gameState.messages.length]);

  const currentPlayer = players[0];
  if (!currentPlayer) return <></>;

  const { id, nickname, hand = [], properties = {}, money = [], rentDue } = currentPlayer;

  return (
    <Box padding={4}>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          backgroundColor: "black",
          border: "4px solid white",
          borderRadius: 1,
          padding: 2,
        }}
      >
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
        {colors
          .filter(color => properties[color]?.length)
          .map((color, pileIndex) => (
            <Box key={pileIndex}>
              {(properties[color] ?? []).map((card, index) => (
                <Card
                  key={card.id}
                  card={card}
                  onFlip={card => {
                    if (card.type === "property" && card.color === "rainbow") {
                      setChooseColorOptions({
                        properties,
                        onChoose: chosenColor =>
                          dispatch({
                            type: "flipPropertyCard",
                            payload: {
                              playerId: id,
                              index,
                              color,
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
                          color: color as SolidColor,
                        },
                      });
                    }
                  }}
                  currentSet={color}
                  sx={{ ":not(:first-of-type)": { marginTop: "-115px" } }}
                />
              ))}
            </Box>
          ))}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", marginTop: 3, gap: 1 }}>
        {hand.map((card, index) => {
          return (
            <Card
              key={card.id}
              card={card}
              onFlip={() =>
                dispatch({
                  type: "flipHandCard",
                  payload: { playerId: id, index },
                })
              }
              onClick={card => {
                if (card.type === "property" && card.color === "rainbow") {
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
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default Game;
