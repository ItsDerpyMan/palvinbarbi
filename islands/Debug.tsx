import { useEffect, useState } from "preact/hooks";

export default function DebugContext() {
    const [html, setHtml] = useState<string>("");

    useEffect(() => {
        console.log("debug")
        const timer = setTimeout(() => {
            fetch("/dev/ctx")
                .then((r) => r.text())
                .then((text) => setHtml(text))
                .catch((e) => setHtml(`${e} error message`));
        }, 1000);
        clearTimeout(timer)
    })
    console.log(html);
    return html;
}