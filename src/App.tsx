import { initializeApp } from "firebase/app";
import {
  child,
  get,
  getDatabase,
  onValue,
  push,
  ref,
  runTransaction,
} from "firebase/database";
import { useLayoutEffect, useRef, useState } from "react";
import Game from "./Game";
import gameReducer, { GameState, init, Payloads } from "./gameReducer";
import StartScreen from "./StartScreen";

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
  const unsubscribeRef = useRef<Function | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const createRoom = (nickname: string) => {
    const newRoomKey = push(child(dbRef, "rooms"), init()).key;
    if (!newRoomKey) return;
    joinRoom(nickname, newRoomKey);
  };

  const joinRoom = async (nickname: string, roomId: string, alreadyInRoom = false) => {
    const roomRef = child(dbRef, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val() as GameState | null;
    if (!room) return false;
    setRoomId(roomId);
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
    const unsubscribe = onValue(roomRef, snapshot => {
      const data = snapshot.val() as GameState | null;
      setGameState(data ?? init());
    });
    unsubscribeRef.current = unsubscribe;
    return true;
  };

  const dispatch = async (payload: Payloads) => {
    const roomRef = child(dbRef, `rooms/${roomId}`);
    await runTransaction(roomRef, (previousState: GameState | null) => {
      if (!previousState) return previousState;
      return gameReducer(previousState, payload);
    });
  };

  const hasJoinedRoom = !!gameState.players.find(({ id }) => id === clientId);

  return hasJoinedRoom ? (
    <Game clientId={clientId} roomId={roomId} gameState={gameState} dispatch={dispatch} />
  ) : (
    <StartScreen onCreateGame={createRoom} onJoinGame={joinRoom} />
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
