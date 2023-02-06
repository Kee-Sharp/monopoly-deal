import { initializeApp } from "firebase/app";
import {
  child,
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
} from "firebase/database";
import { nanoid } from "nanoid";
import { useLayoutEffect, useRef, useState } from "react";
import Game from "./Game";
import gameReducer, { GameState, init, Payloads } from "./gameReducer";
import StartScreen from "./StartScreen";
import WaitingRoom from "./WaitingRoom";
import WinScreen from "./WinScreen";
import cards from "./cards.json";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database);

function App() {
  const clientId = generateClientId();
  const [gameState, setGameState] = useState(init());
  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState(() => sessionStorage.getItem("nickname") ?? "");
  const unsubscribeRef = useRef<Function | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const isInRoom = async () => {
    const roomsRef = child(dbRef, "rooms");
    const snapshot = await get(roomsRef);
    const rooms = (snapshot.val() ?? {}) as Record<string, GameState>;
    for (let [roomId, room] of Object.entries(rooms)) {
      const { players = [] } = room;
      const matchingPlayer = players.find(({ id }) => id === clientId);
      if (matchingPlayer) {
        return { roomId, nickname: matchingPlayer.nickname };
      }
    }
  };

  useLayoutEffect(() => {
    isInRoom().then(result => {
      if (!result) return;
      const { nickname, roomId } = result;
      joinRoom(nickname, roomId, true);
    });
    return () => unsubscribeRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const createRoom = async (nickname: string) => {
    const newRoomKey = nanoid(8);
    await set(child(dbRef, `rooms/${newRoomKey}`), init());
    joinRoom(nickname, newRoomKey);
  };

  const joinRoom = async (nickname: string, roomId: string, alreadyInRoom = false) => {
    const roomRef = child(dbRef, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val() as GameState | null;
    if (!room) return false;
    setRoomId(roomId);
    setNickname(nickname);
    sessionStorage.setItem("nickname", nickname);
    let newState = room;
    if (!alreadyInRoom) {
      let successfullyAddedUser = false;
      while (!successfullyAddedUser) {
        // eslint-disable-next-line no-loop-func
        await runTransaction(roomRef, (prevState: GameState | null) => {
          if (!prevState) return prevState;
          newState = gameReducer(room, {
            type: "addPlayer",
            payload: { id: clientId, nickname },
          });
          successfullyAddedUser = true;
          return newState;
        });
      }
    }
    setGameState(newState);
    unsubscribeRef.current?.();
    const unsubscribe = onValue(roomRef, snapshot => {
      const data = snapshot.val() as GameState | null;
      setGameState(data ?? init());
    });
    unsubscribeRef.current = unsubscribe;
    const imageModules = await Promise.all(cards.map(({ id }) => import(`../public/${id}.png`)));
    setImages(imageModules.map(m => m.default));
    return true;
  };

  const dispatch = async (payload: Payloads) => {
    const roomRef = child(dbRef, `rooms/${roomId}`);
    await runTransaction(roomRef, (previousState: GameState | null) => {
      if (!previousState) return previousState;
      return gameReducer(previousState, payload);
    });
  };

  const leaveRoom = async (alreadyLeft = false) => {
    if (!alreadyLeft) await dispatch({ type: "removePlayer", payload: clientId });
    const roomRef = child(dbRef, `rooms/${roomId}`);
    const gameSnapshot = await get(roomRef);
    const state = gameSnapshot.val() as GameState | null;
    if (!state?.players?.length && !alreadyLeft) remove(roomRef);
    unsubscribeRef.current?.();
    setGameState(init());
  };

  const hasJoinedRoom = !!gameState.players?.find(({ id }) => id === clientId);
  if (!hasJoinedRoom && gameState.winner)
    return (
      <WinScreen
        winner={gameState.winner}
        onLeave={() => leaveRoom(true)}
        onRejoin={() => joinRoom(nickname, roomId)}
      />
    );
  if (!hasJoinedRoom) return <StartScreen onCreateGame={createRoom} onJoinGame={joinRoom} />;
  if (!gameState.gameStarted)
    return (
      <WaitingRoom
        roomId={roomId}
        players={gameState.players}
        onStart={() => dispatch({ type: "startGame" })}
        onLeave={leaveRoom}
      />
    );
  return (
    <Game
      clientId={clientId}
      gameState={gameState}
      dispatch={dispatch}
      onLeave={leaveRoom}
      images={images}
    />
  );
}

const generateClientId = () => {
  // Check if the client ID is already stored in sessionStorage
  const clientId = sessionStorage.getItem("clientId");
  if (clientId) return clientId;
  // Generate a new client ID
  const newClientId = "client_" + Math.random().toString(36).substring(2, 15);
  // Store the client ID in sessionStorage
  sessionStorage.setItem("clientId", newClientId);
  return newClientId;
};

export default App;
