import { Dialog, Box, Button, Typography } from "@mui/material";
import Card from "./Card";
import type { Player, StagedAction } from "./gameReducer";

interface StagedActionDialogProps {
  stagedAction: StagedAction;
  currentPlayer: Player;
  targetedPlayer: Player;
  sayNo: () => void;
  letItHappen: () => void;
}

const StagedActionDialog = ({
  stagedAction,
  currentPlayer,
  targetedPlayer,
  sayNo,
  letItHappen,
}: StagedActionDialogProps) => {
  const { cardId, takingIndices, givingIndex } = stagedAction;
  const takingProperties = targetedPlayer.properties.filter((_, index) =>
    takingIndices.includes(index)
  );
  const givingProperties = currentPlayer.properties.filter((_, index) => index === givingIndex);
  const display = [takingProperties];
  if (givingIndex) display.unshift(givingProperties);
  let title = "";
  switch (cardId) {
    case 24:
      title = `${currentPlayer.nickname} is trying to take a full set from you`;
      break;
    case 26:
      title = `${currentPlayer.nickname} is trying to take a card from you`;
      break;
    case 27:
      title = `${currentPlayer.nickname} is trying to swap cards with you`;
      break;
  }
  return (
    <Dialog open sx={{ ".MuiPaper-root": { borderRadius: 2 } }}>
      <Box
        sx={{
          borderRadius: 2,
          border: "2px solid",
          borderColor: currentPlayer.displayHex,
          backgroundColor: "grey.900",
          display: "flex",
          flexDirection: "column",
          padding: 2,
          paddingTop: 0,
        }}
      >
        <Typography sx={{ color: "white", marginY: 2 }}>{title}</Typography>
        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          {display.map((properties, index) => {
            const isLosing = index === display.length - 1;
            return (
              <Box key={index}>
                <Typography
                  sx={{
                    color: isLosing ? "error.light" : "lightgreen",
                    fontSize: 10,
                    marginBottom: 1,
                  }}
                >{`Cards you're ${isLosing ? "losing" : "getting"}`}</Typography>
                {properties.map((property, propertyIndex) => (
                  <Card
                    key={`${isLosing ? "losing" : "getting"}-${propertyIndex}`}
                    card={property}
                    canFlip={false}
                    sx={{
                      cursor: "default",
                      ":not(:first-of-type)": {
                        marginTop: "calc(-1.5 * var(--size) * 0.82)",
                      },
                      ":hover": {},
                    }}
                  />
                ))}
              </Box>
            );
          })}
        </Box>
        <Box sx={{ display: "flex", marginTop: 2, justifyContent: "space-around" }}>
          <Button
            className={
              !targetedPlayer.hand?.length || !targetedPlayer.hand.some(({ id }) => id === 25)
                ? "disabled"
                : ""
            }
            color="success"
            onClick={sayNo}
            sx={{ fontSize: 8 }}
          >
            Just Say No!
          </Button>
          <Button color="error" onClick={letItHappen} sx={{ fontSize: 8 }}>
            Let It Happen
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
export default StagedActionDialog;
