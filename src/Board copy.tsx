import { colors, Player, SolidColor, TCard } from "./gameReducer";
import { Box, Dialog, Typography } from "@mui/material";
import { useState } from "react";
import Card from "./Card";

interface BoardProps {
  player: Player;
  myBoard?: boolean;
  onFlip?: (card: TCard, index: number, currentColor: SolidColor) => void;
}
const Board = ({ player, myBoard, onFlip }: BoardProps) => {
  const { id, nickname, hand, properties, money } = player;
  const [showBills, setShowBills] = useState(false);
  return (
    <Box
      sx={{
        backgroundColor: "black",
        border: "4px solid",
        borderColor: "primary.main",
        borderRadius: 1,
        padding: 2,
        position: "relative",
        // overflowY: "visible",
        // ...(!myBoard && { zoom: 0.8 }),
      }}
    >
      <Dialog
        open={showBills}
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
            overflowX: "scroll",
            alignItems: "center",
            paddingX: 2,
            paddingY: 1,
            "::-webkit-scrollbar": {
              width: "5px",
              height: "8px",
              // backgroundColor: "#a00" /* or add it to the track */,
            },
            "::-webkit-scrollbar,::-webkit-scrollbar-corner": {
              backgroundColor: "hsla(0,0%,100%,.1)" /* or add it to the track */,
            },
          }}
        >
          <Typography
            sx={{ color: "white", fontSize: 8 }}
          >{`${nickname}'s money`}</Typography>
          <Box sx={{ display: "flex", marginTop: 1 }}>
            {money.map((card, index) => (
              <Card
                key={`{card.id}-${index}`}
                card={card}
                sx={{ ":not(:first-of-type)": { marginLeft: "-54px" }, ":hover": {} }}
              />
            ))}
          </Box>
        </Box>
      </Dialog>
      {/* Nickname and total money */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          color: "white",
          marginBottom: 2,
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
          // flexWrap: "wrap",
          width: "100%",
          overflowX: "auto",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {colors
          .filter(color => properties[color]?.length)
          .map(color => (
            <Box
              key={color}
              sx={{
                transformOrigin: "center top",
                transition: "all 0.2s ease 0s",
                ":hover": { transform: "scale(1.2)", zIndex: 2 },
              }}
            >
              {(properties[color] ?? []).map((card, index) => (
                <Card
                  key={`${color}-card ${card.id}-${index}`}
                  card={card}
                  onFlip={card => onFlip?.(card, index, color)}
                  currentSet={color}
                  sx={{
                    ":not(:first-of-type)": {
                      marginTop: "calc(-1.5 * var(--size) * 0.82)",
                    },
                    ":hover": {},
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
