
export function deleteCookie(headers: Headers, key: string): void {
    headers.append(
        "Set-Cookie",
        `${key}=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    );
}

export function deleteAuthCookies(headers: Headers): void {
    deleteCookie(headers, "jwt");
    deleteCookie(headers, "session");
    deleteCookie(headers, "user");
    deleteCookie(headers, "username");
    deleteCookie(headers, "room"); // If you want to clear this too
}

export function setCookie(headers: Headers, key: string, value: string): void {
    headers.append(
        "Set-Cookie",
        `${key}=${value}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=3600`
    );
}
