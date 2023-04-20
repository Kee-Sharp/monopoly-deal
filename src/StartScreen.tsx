import { ArrowBackIosNew, ArrowForwardIos, Close, NewReleases } from "@mui/icons-material";
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
  clientId: string;
}

type ChangelogVersion = parseChangelog.Changelog["versions"][number];

const StartScreen = ({ onCreateGame, onJoinGame, clientId }: StartScreenProps) => {
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const [allVersions, setAllVersions] = useState<ChangelogVersion[]>([]);
  const [newVersion, setNewVersion] = useState<ChangelogVersion>();

  const newIndex = allVersions.findIndex(({ version }) => version === newVersion?.version) ?? 0;

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
      const response = await fetch(
        import.meta.env.DEV
          ? "/CHANGELOG.md"
          : "https://raw.githubusercontent.com/kee-sharp/monopoly-deal/master/CHANGELOG.md"
      );
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
      console.log(result);
      if (!result) return;
      setAllVersions(result.versions);
      const mostRecent = result.versions[0];
      const mostRecentSeen = localStorage.getItem("MDVersion");
      if (mostRecent.version !== mostRecentSeen) setNewVersion(mostRecent);
    });
  }, []);

  const closeVersionDialog = () => {
    localStorage.setItem("MDVersion", allVersions[0]?.version ?? "");
    setNewVersion(undefined);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 2,
        height: "100svh",
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
            paddingY: 1,
            paddingX: 3,
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
        {newIndex > 0 && (
          <IconButton
            onClick={() => setNewVersion(allVersions?.[newIndex - 1])}
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 8,
              margin: "auto 0",
              color: "grey.700",
              height: "fit-content",
            }}
          >
            <ArrowBackIosNew />
          </IconButton>
        )}
        {newIndex < allVersions.length - 2 && (
          <IconButton
            onClick={() => setNewVersion(allVersions?.[newIndex + 1])}
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 8,
              margin: "auto 0",
              color: "grey.700",
              height: "fit-content",
            }}
          >
            <ArrowForwardIos />
          </IconButton>
        )}
        {!!newVersion?.date && (
          <Typography
            color="grey.700"
            fontSize={12}
            sx={{ position: "absolute", left: 0, right: 0, bottom: 8, textAlign: "center" }}
          >
            {new Date(newVersion.date).toLocaleDateString()}
          </Typography>
        )}
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
      <Typography sx={{ position: "absolute", bottom: 24, color: "grey.800" }}>
        {clientId}
      </Typography>
      <IconButton
        sx={{ position: "absolute", bottom: 24, right: 24, color: "grey.300" }}
        onClick={() => setNewVersion(allVersions[0])}
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
