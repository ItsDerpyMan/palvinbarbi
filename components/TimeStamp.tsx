import { format } from "timeago.js";

interface TimeStampProps {
  time: number;
  className?: string;
}

export function TimeStamp({ time, className }: TimeStampProps) {
    const defaultClasses = "mx-1 px-1 py-1 bg-gray-60 rounded-md shadow-md"; // Your default classes
    const combinedClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  return (
    <div className={combinedClasses}>
      <p class="text-black-" >{format(time)}</p>
    </div>
  );
}
