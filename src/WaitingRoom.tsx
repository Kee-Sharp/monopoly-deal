import { useState, useLayoutEffect } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import RoomPreferences from "@mui/icons-material/RoomPreferences";
import type { Player } from "./gameReducer";
import QRCode from "qrcode";

interface WaitingRoomProps {
  roomId: string;
  players?: Player[];
  spectators?: Player[];
  onStart: () => void;
  onLeave: () => void;
  onShowConfig: () => void;
  toggleSpectator: (id: string) => Promise<void>;
}

const WaitingRoom = ({
  roomId,
  players = [],
  spectators = [],
  onStart,
  onLeave,
  onShowConfig,
  toggleSpectator,
}: WaitingRoomProps) => {
  const linkToRoom = `${
    import.meta.env.DEV ? "http://127.0.0.1:5173" : "https://kee-sharp.github.io"
  }/monopoly-deal/?roomId=${roomId}`;
  const [copied, setCopied] = useState(false);

  useLayoutEffect(() => {
    try {
      QRCode.toCanvas(document.getElementById("qr"), linkToRoom, { margin: 1, scale: 3 });
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 4,
        paddingBottom: 5,
        height: "100svh",
        position: "relative",
      }}
    >
      <IconButton
        onClick={onShowConfig}
        color="secondary"
        sx={{ position: "absolute", top: 24, right: 8 }}
      >
        <RoomPreferences />
      </IconButton>
      <Box sx={{ flex: 1 }}>
        <Typography color="white" marginBottom={1}>
          Friends who have joined:
        </Typography>
        {players.map(({ id, displayHex, nickname }) => (
          <Typography key={id} color={displayHex} fontSize="14px">
            {nickname}
          </Typography>
        ))}
        {!!spectators.length && (
          <>
            <Typography color="white" fontSize="12px" marginTop={1}>
              Spectators:
            </Typography>
            {spectators.map(({ id, displayHex, nickname }) => (
              <Typography key={id} color={displayHex} fontSize="10px">
                {nickname}
              </Typography>
            ))}
          </>
        )}
      </Box>
      <Box sx={{ display: "flex", marginBottom: 3, alignItems: "center" }}>
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
      <canvas
        id="qr"
        style={{ marginBottom: 24 }}
        onClick={() => navigator.clipboard.writeText(linkToRoom)}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
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
