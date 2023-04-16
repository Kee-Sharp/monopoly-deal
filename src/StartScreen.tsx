import { Close, NewReleases } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  TextField,
  Typography,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import parseChangelog from "changelog-parser";
import React, { useEffect, useState } from "react";
import ChangeList from "./ChangeList";

interface StartScreenProps {
  onCreateGame: (nickname: string) => void;
  onJoinGame: (nickname: string, roomId: string) => Promise<boolean>;
}

type ChangelogVersion = parseChangelog.Changelog["versions"][number];

const StartScreen = ({ onCreateGame, onJoinGame }: StartScreenProps) => {
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const [mostRecentVersion, setMostRecentVersion] = useState<ChangelogVersion>();
  const [newVersion, setNewVersion] = useState<ChangelogVersion>();

  const handleJoin = async () => {
    if (!nickname.length) setNicknameError(true);
    else if (!roomId.length) setJoinError(true);
    else {
      const result = await onJoinGame(nickname, roomId);
      if (!result) setJoinError(true);
    }
  };

  const fetchAndParseChangeLog = async () => {
    try {
      const response = await fetch("/CHANGELOG.md");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const changelogContent = await response.text();
      const parsedChangelog = await parseChangelog({ text: changelogContent });
      return parsedChangelog;
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };

  useEffect(() => {
    fetchAndParseChangeLog().then(result => {
      if (!result) return;
      const mostRecent = result.versions[0];
      setMostRecentVersion(mostRecent);
      const mostRecentSeen = localStorage.getItem("MDVersion");
      if (mostRecent.version !== mostRecentSeen) setNewVersion(mostRecent);
    });
  }, []);

  const closeVersionDialog = () => {
    localStorage.setItem("MDVersion", newVersion?.version ?? "");
    setNewVersion(undefined);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 2,
        height: "100vh",
        position: "relative",
      }}
    >
      <Dialog
        open={!!newVersion}
        TransitionComponent={Transition}
        keepMounted
        onClose={closeVersionDialog}
        sx={{ ".MuiPaper-root": { backgroundColor: "grey.900" } }}
      >
        <Box
          sx={{
            border: "2px solid #99f",
            display: "flex",
            flexDirection: "column",
            padding: 1,
          }}
        >
          <DialogTitle
            sx={{
              color: "white",
              fontSize: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingX: 2,
            }}
          >
            <Typography>What's new in Version {newVersion?.version}</Typography>
            <IconButton onClick={closeVersionDialog} sx={{ color: "white", padding: 0.25 }}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ paddingX: 2 }}>
            {newVersion?.parsed["Features"] && (
              <ChangeList title="Features" list={newVersion?.parsed["Features"]} />
            )}
            {newVersion?.parsed["Bug Fixes"] && (
              <ChangeList title="Bug Fixes" list={newVersion?.parsed["Bug Fixes"]} />
            )}
          </DialogContent>
        </Box>
      </Dialog>
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
      <IconButton
        sx={{ position: "absolute", bottom: 24, right: 24, color: "grey.300" }}
        onClick={() => setNewVersion(mostRecentVersion)}
      >
        <NewReleases />
      </IconButton>
    </Box>
  );
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default StartScreen;
