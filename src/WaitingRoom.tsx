import { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import type { Player } from "./gameReducer";

interface WaitingRoomProps {
  roomId: string;
  players: Player[];
  onStart: () => void;
}

const WaitingRoom = ({ roomId, players, onStart }: WaitingRoomProps) => {
  const [copied, setCopied] = useState(false);
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
        onClick={onStart}
        sx={{ marginTop: 4 }}
        disabled={players.length <= 1}
      >
        Start Game
      </Button>
    </Box>
  );
};
export default WaitingRoom;
