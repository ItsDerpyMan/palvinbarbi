import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";

interface Room {
    id: number;
    name: string;
    hasStarted: boolean;
    numberOfPlayers: number;
    created: number;
}
export default function Room() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("api/rooms")
        .then((res) => res.json())
        .then((json) => setData(json))
        .catch(console.error);
    }, []);

  return (
    <div>
      <h3>Room {data.id}</p>
      <button onClick={() => (data.string += 1)}>Join</button>
    </div>
  );
}
