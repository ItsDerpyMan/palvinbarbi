import { Signal, useSignal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { TimeStamp } from "../components/TimeStamp.tsx";
import { PlayerCount } from "../components/PlayerCount.tsx";
import type { Room } from "../utils/database/database.ts";

interface RoomProps {
  key?: string;
  id?: string;
  data: Room;
  input: Signal<string>;
}
export default function RoomIsland({ data, input }: RoomProps) {
  const room = useSignal(data);
  const count = useSignal<number>(0);

  function getCookie(name: string): string | null {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1];

    return value ? decodeURIComponent(value) : null;
  }

  const handleJoin = async () => {
    if (!input.value.trim()) {
      alert("Please enter a username!");
      return;
    }
    const redirectUrl = `/api/signup?room=${data.id}`;
    const encodedRedirect = encodeURIComponent(redirectUrl);

    const formData = new FormData();
    formData.append('username', input.value);

    let loginUrl = `/api/login`;
    const session = getCookie('session');
    if (session) {
      loginUrl += `?session=${session}`;
      loginUrl += `&redirect=${encodedRedirect}`
    } // only added to /api/login
    else loginUrl += `?redirect=${encodedRedirect}`;

    const res = await fetch(loginUrl, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const { redirect } = await res.json();
      globalThis.history.replaceState({}, "", redirect); // changes URL instantly
    } else console.error(res.json().then((e) => e.error));
  };
  return (
    <div class="card">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold truncate">{room.value.name}</h2>
        <span class="text-sm text-gray-500">{room.value.id}</span>
      </div>

      <div class="flex justify-between items-center">
        <Button onClick={handleJoin}>Join</Button>
        <TimeStamp time={Date.parse(room.value.created_at)} />
        <PlayerCount count={count.value} />
      </div>
    </div>
  );
}
