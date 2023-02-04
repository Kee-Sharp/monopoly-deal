import type { Player, TCard } from "./gameReducer";
import { Box, Button } from "@mui/material";
import ColoredText from "./ColoredText";
import Card from "./Card";

interface WinScreenProps {
  winner: { player: Player; cards: TCard[] };
  onLeave: () => void;
  onRejoin: () => void;
}

const WinScreen = ({ winner, onLeave, onRejoin }: WinScreenProps) => {
  return (
    <Box
      sx={{
        padding: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowX: "hidden",
      }}
    >
      <ColoredText
        sentence={`Congrats! ${winner.player.nickname} has won!`}
        coloredWords={[winner.player.nickname]}
        color={winner.player.displayHex}
      />
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box
          className="custom-scrollbar"
          sx={{
            display: "flex",
            overflowX: "auto",
            gap: 1,
            paddingBottom: 0.25,
            marginTop: 2,
            marginBottom: 4,
          }}
        >
          {winner.cards.map((card, index) => (
            <Card key={index} card={card} canFlip={false} sx={{ flexShrink: 0, ":hover": {} }} />
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
        <Button color="success" onClick={onRejoin}>
          Play Again
        </Button>
        <Button color="error" onClick={onLeave}>
          Leave Room
        </Button>
      </Box>
    </Box>
  );
};
export default WinScreen;
