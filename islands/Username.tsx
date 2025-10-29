import { useEffect } from "preact/hooks";
import type { Signal} from "@preact/signals";


interface UsernameInputProps {
  id?: string;
  class?: string;
  username?: Signal<string>;
}

export default function UsernameInput({username, ...props }: UsernameInputProps) {
  return (
    <form onsubmit={(e) => e.preventDefault()} id={props.id} class={props.class}>
      <input
        type="text"
        value={username}
        onInput={(e) => (username.value = (e.target as HTMLInputElement).value)}
        placeholder="Enter username"
      />
    </form>
  );
}
