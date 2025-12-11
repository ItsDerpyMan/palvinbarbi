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
      try {
          const redirected = await handleLogin();
          const signupResponse = await handleSignup(redirected);
      }
  }
  const handleSignup = async (redirect: string): Promise<Response> => {
      const res = await fetch(redirect, {
          method: "POST",
          credentials: "same-origin",
      }).then((res) => res.json().then(data => setUrlState(data.redirect)));
      if (!res.ok) {
          // remove room cookie
          // Get => /

      }
  }
  const handleLogin = async () => {
      if (!input.value.trim()) {
          alert("Please enter a username!");
          throw new Error("Please enter a username!");
      }
      const redirectUrl = encodeURIComponent(`/api/signup?room=${data.id}`);
      const url = constructUrl("/api/login", [`redirect=${redirectUrl}`])
      setUrlState(url);
      const res = await fetch(url, {
          method: "POST",
          body: (): FormData => new FormData().append('username', input.value),
          credentials: 'include',
      }).then(() => setUrlState(redirectUrl));
      if (!res.ok) throw new Error(res.json().then((e) => e.error));
      return res.json().then(b => b.redirect);
  }
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

function setUrlState(redirect: string):void {
    globalThis.history.replaceState({}, "", redirect);
}
async function setLocation(res: Response):Promise<void> {
    const { redirect } = await res.json();
    if(!redirect) throw new Error("Cant redirect to an invalid location!.");
    globalThis.location.href = redirect;
}
const constructUrl = (base: string, params: string[] = []) =>
    params.length ? `${base}?${params.join('&')}` : base;

