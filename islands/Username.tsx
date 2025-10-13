import { useState } from "preact/hooks";

interface UsernameInputProps {
  id?: string;
  class?: string;
}

export default function UsernameInput({ ...props }: UsernameInputProps) {
    const [username, set_username] = useState<string>(localStorage.getItem("username") ?? "");
    const handleInput = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        set_username(value);
        localStorage.setItem("username", value);
    };
  return (
    <form id={props.id} class={props.class}>
      <input
        type="text"
        value={username}
        onInput={handleInput}
        placeholder="Enter username"
      />
    </form>
  );
}
