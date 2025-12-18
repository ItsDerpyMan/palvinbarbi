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

  const handleJoin = async () => {
        try {
            // Step 1: Login (creates or restores session)
            const signupUrl = await handleLogin();

            // Step 2: Signup (joins the room)
            const joinUrl = await handleSignup(signupUrl);

            // Step 3: Join (redirects to room page)
            globalThis.location.href = joinUrl;

        } catch (error) {
            console.error("Failed to join room:", error);
            alert(error instanceof Error ? error.message : "Failed to join room");
        }
    }

  const handleSignup = async (redirect: string) => {
      const res: Response = await fetch(redirect, {
          method: "POST",
          credentials: "same-origin",
      });
      if (!res.ok) {
        throw new Error(await res.json().then((res) => res.error));
      }
      const data = await res.json();
      setUrlState(data.redirect);
      return data.redirect;
  }
  const handleLogin = async () => {
      if (!input.value.trim()) {
          alert("Please enter a username!");
          throw new Error("Please enter a username!");
      }

      const redirectUrl = encodeURIComponent(`/api/signup?room=${data.id}`);
      const url = constructUrl("/api/login", [`redirect=${redirectUrl}`])
      setUrlState(url);

      const formData = new FormData();
      formData.append("username", input.value);
      try {
          const res = await fetch(url, {
              method: "POST",
              body: formData,
              credentials: 'include',
          });

          const responseData = await res.json();

          if (!res.ok) {
              throw new Error(responseData.error || 'Login failed');
          }

          setUrlState(responseData.redirect);
          return responseData.redirect;
      }
      catch (error) {
          console.error('Login error: ', error);
          throw error
      }
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

const constructUrl = (base: string, params: string[] = []) =>
    params.length ? `${base}?${params.join('&')}` : base;