import { useReducer } from "react";
import gameReducer, { init } from "./gameReducer";

const Game = () => {
  const [gameState, dispatch] = useReducer(gameReducer, init());
  return <>Game</>;
};

export default Game;
