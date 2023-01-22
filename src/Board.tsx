import { colors, Player, SolidColor, TCard } from "./gameReducer";
import { Box, Dialog, Typography } from "@mui/material";
import { SystemStyleObject } from "@mui/system";
import { Theme } from "@mui/material";
import { useState } from "react";
import Card from "./Card";

interface BoardProps {
  player: Player;
  myBoard?: boolean;
  isTurn?: boolean;
  onFlip?: (card: TCard, index: number, currentColor: SolidColor) => void;
  sx?: SystemStyleObject<Theme>;
}
const Board = ({ player, myBoard, isTurn = false, onFlip, sx }: BoardProps) => {
  const { nickname, displayHex, hand = [], properties = {}, money = [] } = player;
  const [showBills, setShowBills] = useState(false);
  const highestNumber = colors.reduce((prevHighest, current) => {
    const colorNumber = properties[current]?.length ?? 0;
    return colorNumber > prevHighest ? colorNumber : prevHighest;
  }, 0);
  return (
    <Box
      sx={{
        backgroundColor: "black",
        border: "4px solid",
        borderColor: displayHex,
        borderRadius: 1,
        padding: 2,
        position: "relative",
        ...sx,
      }}
    >
      <Dialog
        open={showBills}
        // scroll="paper"
        disablePortal
        onClose={() => setShowBills(false)}
        sx={{ position: "absolute", bottom: "auto" }}
      >
        <Box
          sx={{
            backgroundColor: "black",
            border: "2px solid white",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            overflowX: "hidden",
            alignItems: "center",
            paddingX: 2,
            paddingY: 1,
          }}
        >
          <Typography
            sx={{ color: "white", fontSize: 8 }}
          >{`${nickname}'s money`}</Typography>
          <Box
            className="custom-scrollbar"
            sx={{ display: "flex", marginTop: 1, overflowX: "auto", width: "100%" }}
          >
            {money.map((card, index) => (
              <Card
                key={`{card.id}-${index}`}
                card={card}
                sx={{
                  flexShrink: 0,
                  ":not(:first-of-type)": { marginLeft: "-54px" },
                  ":hover": {},
                }}
              />
            ))}
          </Box>
        </Box>
      </Dialog>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          color: "white",
          marginBottom: 2,
          gap: 2,
        }}
      >
        <Typography>{nickname}</Typography>
        <Typography>
          {`${hand.length} card${hand.length === 1 ? "" : "s"} in hand | `}
          <span
            onClick={() => {
              if (money.length) setShowBills(true);
            }}
          >{`${money.reduce((total, { value }) => total + value, 0)}M`}</span>
        </Typography>
      </Box>
      <Box
        className="custom-scrollbar"
        sx={{
          display: "flex",
          width: "100%",
          gap: 0.5,
          overflowX: "auto",
          paddingBottom: `calc(16px + (1 + (${
            highestNumber - 1
          } * 0.18)) * 1.5 * var(--size) * 0.2)`,
        }}
      >
        {colors
          .filter(color => properties[color]?.length)
          .map(color => (
            <Box
              key={color}
              sx={{
                height: "min-content",
                transformOrigin: "top left",
                transition: "all 0.2s ease 0s",
                ":hover": { transform: "scale(1.2)", zIndex: 2 },
              }}
            >
              {(properties[color] ?? []).map((card, index) => (
                <Card
                  key={`${color}-card ${card.id}-${index}`}
                  card={card}
                  canFlip={isTurn}
                  onFlip={card => onFlip?.(card, index, color)}
                  currentSet={color}
                  sx={{
                    ":not(:first-of-type)": {
                      marginTop: "calc(-1.5 * var(--size) * 0.82)",
                    },
                    ":hover": {},
                    ...((!myBoard || !isTurn) && { cursor: "default" }),
                  }}
                />
              ))}
            </Box>
          ))}
      </Box>
    </Box>
  );
};
export default Board;
