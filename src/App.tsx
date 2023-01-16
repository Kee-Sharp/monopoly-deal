import { useState } from "react";
import Game from "./Game";
import StartScreen from "./StartScreen";

function App() {
  const [hasJoinedRoom, setHasJoinedRoom] = useState(true);

  return hasJoinedRoom ? <Game /> : <StartScreen />;
}

export default App;
