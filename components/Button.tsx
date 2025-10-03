import type { ComponentChildren } from "preact";

export interface ButtonProps {
  id?: string;
  onClick?: () => void;
  children?: ComponentChildren;
  disabled?: boolean;
  className?: string;
}

export function Button(props: ButtonProps) {
    const defaultClasses = "px-2 py-1 border-gray-500 border-2 rounded-sm bg-white hover:bg-gray-200 transition-colors";
    const combinedClasses = props.className ? `${defaultClasses} ${props.className}` : defaultClasses;
  return (
    <button
      {...props}
      className={combinedClasses}
    />
  );
}
