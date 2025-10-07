import { format } from "timeago.js";

interface TimeStampProps {
  time: number;
  id?: string;
  class?: string;
}

export function TimeStamp({ time, ...props }: TimeStampProps) {
  return (
    <div id={props.id} class={props.class}>
      <p class="text-black-">{format(time)}</p>
    </div>
  );
}
