import type { Signal } from "@preact/signals";

interface UsernameInputProps {
  id?: string;
  class?: string;
  username?: Signal<string>;
}

export default function UsernameInput(
  { username, ...props }: UsernameInputProps,
) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      id={props.id}
      class={props.class}
    >
      <input
        type="text"
        value={username?.value ?? ""}
        onInput={(
          e,
        ) => {
          if (username) username.value = e.currentTarget.value;
        }}
        placeholder="Enter username"
      />
    </form>
  );
}
