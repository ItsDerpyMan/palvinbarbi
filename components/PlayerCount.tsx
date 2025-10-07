interface PlayerCountProps {
  count: number;
  id?: string;
  class?: string;
}

export function PlayerCount({ count, ...props }: PlayerCountProps) {
  return (
    <div id={props.id} class={props.class}>
      {count} / {20}
    </div>
  );
}
