import { JSX } from "preact";

type ButtonProps = JSX.IntrinsicElements["button"] & {
    variant?: "primary" | "secondary" | "accent" | "ghost" | "link" | "neutral";
    size?: "xs" | "sm" | "md" | "lg";
    outline?: boolean;
};

export function Button({
    children,
    variant = "primary",
    size = "md",
    outline = false,
    class: className = "",
    ...props
}: ButtonProps) {
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== "md" ? `btn-${size}` : "";
    const outlineClass = outline ? "btn-outline" : "";

    return (
        <button
            class={`btn ${variantClass} ${sizeClass} ${outlineClass} ${className}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
}