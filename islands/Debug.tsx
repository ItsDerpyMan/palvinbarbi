import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { Auth} from "../utils/auth.ts";
import DebugContext from "../components/DebugContext.tsx";
import Loading from "../components/Loading.tsx";

export default function DebugPanel() {
    const [context, setContext] = useState<Auth | null>(null)
    const poll = async () => {
        const res = await fetch("/debug/ctx", { method: "POST", headers: { "Content-Type": "application/json"}});
        if(res.ok) setContext(await res.json());
        else setContext(null);
    }
    useEffect(() => {
        poll();
        const interval = setInterval(poll, 5000);
        return () => clearInterval(interval);
    }, []);

    if(!context) return <Loading></Loading>;

    return <DebugContext data={context}></DebugContext>;
}

// const fetchHtml = (url: string, selector: string = "div") => {
//     // This uses Fresh's own client router under the hood
//     const controller = new AbortController();
//     fetch(`/${url}`, { signal: controller.signal })
//         .then(r => r.text())
//         .then(text => {
//             const parser = new DOMParser();
//             const doc = parser.parseFromString(text, "text/html");
//             const bodyContent = doc.querySelector(selector)?.innerHTML;
//             html.value = bodyContent ?? text;
//         });
//     return () => controller.abort();
// }