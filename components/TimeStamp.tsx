import { format } from "timeago.js";

interface TimeStampProps {
  time: number;
  class?: string;
}

export function TimeStamp({ time, ...props }: TimeStampProps) {
  return (
    <div class={props.class}>
      <p class="text-black-">{format(time)}</p>
    </div>
  );
}
