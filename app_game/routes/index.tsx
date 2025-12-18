import { PageProps } from "fresh";
import {Auth, define} from "../../utils/utils.ts";

/**
 * Game App Index/Lobby
 * Route: /rooms/
 *
 * This page is likely redundant since users join specific rooms via /rooms/[id]
 * Options:
 * 1. Redirect to main menu
 * 2. Show a lobby/waiting area
 * 3. Display room list (if needed)
 */

export const handler = define.handlers({
    GET(_ctx) {
        return { data: { foo: "Deno"}};
    }
})
export default define.page<typeof handler>((props) => {
    return new Response(JSON.stringify(props), { status: 200 , headers: { "Location": "/" }});
})