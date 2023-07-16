import {
  Add,
  ArrowBackIosNew,
  ArrowForwardIos,
  Check,
  Close,
  ManageSearch,
  NewReleases,
  Replay,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import parseChangelog from "changelog-parser";
import React, { useEffect, useState } from "react";
import ChangeList from "./ChangeList";
import { GameState, Player } from "./gameReducer";
import useSingleClick from "./useSingleClick";
import clsx from "clsx";

interface StartScreenProps {
  onCreateGame: (nickname: string) => void;
  onJoinGame: (nickname: string, roomId: string) => Promise<boolean>;
  clientId: string;
  isInRoom: (
    idsToCheck: string[]
  ) => Promise<{ roomId: string; player: Player; room: GameState }[]>;
  rejoinRoom: (newClientId: string) => void;
}

type ChangelogVersion = parseChangelog.Changelog["versions"][number];

const StartScreen = ({
  onCreateGame,
  onJoinGame,
  clientId,
  isInRoom,
  rejoinRoom,
}: StartScreenProps) => {
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const [allVersions, setAllVersions] = useState<ChangelogVersion[]>([]);
  const [newVersion, setNewVersion] = useState<ChangelogVersion>();
  const [previousRooms, setPreviousRooms] =
    useState<Awaited<ReturnType<StartScreenProps["isInRoom"]>>>();

  const singleOnCreate = useSingleClick(() => onCreateGame(nickname), [nickname], 1000);

  const newIndex = allVersions.findIndex(({ version }) => version === newVersion?.version) ?? 0;

  const roomIdMatch = window.location.search.match(/roomId=([A-Za-z0-9_-]{8})\b/)?.[1];

  const handleJoin = async () => {
    if (!nickname.length) setNicknameError(true);
    else if (!roomId.length) setJoinError(true);
    else {
      const result = await onJoinGame(nickname, roomId);
      if (!result) setJoinError(true);
    }
  };
  const singleJoin = useSingleClick(handleJoin, [nickname, roomId], 3000);

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
    if (roomIdMatch) {
      setShowJoinInput(true);
      setRoomId(roomIdMatch);
    }
  }, [roomIdMatch]);

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
            paddingX: 2.5,
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
            {newVersion?.parsed["Coming Soon"] && (
              <ChangeList title="Coming Soon" list={newVersion?.parsed["Coming Soon"]} italic />
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
              paddingX: 0,
            }}
          >
            <ArrowBackIosNew />
          </IconButton>
        )}
        {!!allVersions?.[newIndex + 1] && allVersions[newIndex + 1].version !== "1.0.0" && (
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
              paddingX: 0,
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
      <Dialog
        open={!!previousRooms}
        keepMounted
        onClose={() => setPreviousRooms(undefined)}
        sx={{ ".MuiPaper-root": { backgroundColor: "grey.900" } }}
      >
        <Box
          sx={{
            border: "2px solid primary.main",
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
              gap: 2,
            }}
          >
            <Typography>All Previous Rooms</Typography>
            <IconButton
              onClick={() => setPreviousRooms(undefined)}
              sx={{ color: "white", padding: 0.25 }}
            >
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ paddingX: 2 }}>
            {previousRooms?.length ? (
              <Table sx={{ "& .MuiTableCell-root": { color: "white" } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Room Id</TableCell>
                    <TableCell>Nickname</TableCell>
                    <TableCell>Other Players</TableCell>
                    <TableCell>Money</TableCell>
                    <TableCell>Rejoin?</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previousRooms.map(({ roomId, player, room }) => (
                    <TableRow key={`${roomId}-${player.id}`}>
                      <TableCell>{roomId}</TableCell>
                      <TableCell>{player.nickname}</TableCell>
                      <TableCell>
                        {room.players
                          .filter(({ id }) => id !== player.id)
                          .map(({ nickname }) => nickname)
                          .join(", ")}
                      </TableCell>
                      <TableCell align="center">
                        {(player.money ?? []).reduce((acc, { value }) => acc + value, 0)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() => rejoinRoom(player.id)}
                        >
                          <Check />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="white" fontSize="14px">
                No rooms found
              </Typography>
            )}
          </DialogContent>
        </Box>
      </Dialog>
      <Typography
        variant="h2"
        textAlign="center"
        color="primary"
        fontWeight="medium"
        sx={{ marginBottom: 6 }}
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
            marginBottom: 8,
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
          className={clsx({ disabled: !!roomId })}
          color="success"
          sx={{ marginBottom: 2 }}
          onClick={() => {
            if (!nickname.length) setNicknameError(true);
            else singleOnCreate();
          }}
          startIcon={<Add />}
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
            <Button color="secondary" onClick={singleJoin}>
              Join
            </Button>
          </Box>
        ) : (
          <Button
            color="secondary"
            onClick={() => setShowJoinInput(true)}
            startIcon={<ManageSearch />}
          >
            Join Game
          </Button>
        )}
        <Button
          className={clsx({ disabled: !!roomId })}
          sx={{ marginTop: 2 }}
          onClick={() => {
            const allSessions = JSON.parse(localStorage.getItem("allSessions") ?? "[]");
            isInRoom(allSessions).then(setPreviousRooms);
          }}
          startIcon={<Replay />}
        >
          Rejoin Game
        </Button>
      </Box>
      <Typography sx={{ position: "absolute", bottom: 24, color: "grey.800" }}>
        {clientId}
      </Typography>
      <IconButton
        sx={{ position: "absolute", bottom: 24, right: 24, color: "grey.300", padding: 0 }}
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
