// Server component - plain HTML input, no island needed
interface UsernameInputProps {
    id?: string;
    class?: string;
    placeholder?: string;
}

export function UsernameInput({
    id = "username",
    class: className = "",
    placeholder = "Enter username"
}: UsernameInputProps) {
    return (
        <input
            type="text"
            id={id}
            name="username"
            placeholder={placeholder}
            class={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autocomplete="off"
        />
    );
}