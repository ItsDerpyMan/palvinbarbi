import { ComponentProps } from "preact";

export interface PlayerCountProps extends ComponentProps<"div"> {
    id: number;
    num: number;
    numOf?: number;
}

export function PlayerCount({ num, numOf = 20, ...rest }: PlayerCountProps) {
  return (
    <div
      {...rest}
      class="inline-flex items-center justify-center px-3 py-1
             rounded-full border border-gray-400 bg-white
             text-sm font-medium text-gray-700"
    >
      {num} / {numOf}
    </div>
  );
}
