import { Box, Button, Typography, TextField } from "@mui/material";
import { useState } from "react";

interface StartScreenProps {
  onCreateGame: (nickname: string) => void;
  onJoinGame: (nickname: string, roomId: string) => Promise<boolean>;
}

const StartScreen = ({ onCreateGame, onJoinGame }: StartScreenProps) => {
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinError, setJoinError] = useState(false);

  const handleJoin = async () => {
    if (!nickname.length) setNicknameError(true);
    else if (!roomId.length) setJoinError(true);
    else {
      const result = await onJoinGame(nickname, roomId);
      if (!result) setJoinError(true);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 2 }}>
      <Typography
        variant="h2"
        textAlign="center"
        color="primary"
        fontWeight="medium"
        sx={{ marginBottom: 4 }}
      >
        Monopoly Deal
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", maxWidth: 240, width: "100%" }}>
        <TextField
          value={nickname}
          onChange={e => {
            setNickname(e.target.value);
            setNicknameError(false);
          }}
          placeholder="What is your name?"
          className={nicknameError ? "error" : ""}
          size="small"
          color="secondary"
          sx={{
            marginBottom: 4,
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "grey.400",
              },
              "&:hover fieldset": {
                borderColor: "grey.200",
              },
            },
          }}
          inputProps={{ sx: { color: "grey.400" } }}
        />
        <Button
          color="success"
          sx={{ marginBottom: 2 }}
          onClick={() => {
            if (!nickname.length) setNicknameError(true);
            else onCreateGame(nickname);
          }}
        >
          Create Game
        </Button>
        {showJoinInput ? (
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              value={roomId}
              placeholder="Enter room id"
              onChange={e => {
                setRoomId(e.target.value);
                setJoinError(false);
              }}
              className={joinError ? "error" : ""}
              size="small"
              color="secondary"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "grey.400",
                  },
                  "&:hover fieldset": {
                    borderColor: "grey.200",
                  },
                },
              }}
              inputProps={{ sx: { color: "grey.400" } }}
            />
            <Button color="secondary" onClick={handleJoin}>
              Join
            </Button>
          </Box>
        ) : (
          <Button color="secondary" onClick={() => setShowJoinInput(true)}>
            Join Game
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default StartScreen;
