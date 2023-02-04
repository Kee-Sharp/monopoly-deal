import { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import type { Player } from "./gameReducer";

interface WaitingRoomProps {
  roomId: string;
  players: Player[];
  onStart: () => void;
  onLeave: () => void;
}

const WaitingRoom = ({ roomId, players, onStart, onLeave }: WaitingRoomProps) => {
  const [copied, setCopied] = useState(false);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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
      <Typography color="white">Friends who have joined:</Typography>
      {players.map(({ id, displayHex, nickname }) => (
        <Typography key={id} sx={{ color: displayHex }}>
          {nickname}
        </Typography>
      ))}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          marginTop: 8,
          gap: 2,
        }}
      >
        <Button className={players.length <= 1 ? "disabled" : ""} onClick={onStart}>
          Start Game
        </Button>
        <Button color="error" onClick={onLeave}>
          Leave Room
        </Button>
      </Box>
    </Box>
  );
};
export default WaitingRoom;
