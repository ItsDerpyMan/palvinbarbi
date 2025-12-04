import { Auth } from "../utils/auth.ts";

export enum InvalidProps {
    Loading,
    Invalid,

}
export default function Loading() {
    return (
        <h1 className="bg-gray-900 text-gray-200 p-5 rounded-xl font-mono text-sm space-y-3">
           Loading...
        </h1>
    )
}