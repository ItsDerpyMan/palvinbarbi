import GameIsland from "../../../islands/GameIsland.tsx";
import { define } from "../../../utils/utils.ts";
import { useSignal } from "@preact/signals";

export enum State {
    initializing,
    waiting,
    playing
}
export const joinHandler = define.handlers({
    GET(ctx) {

    }
})
export default define.page<typeof joinHandler>((props) => {
    const roomId = props.params.id;

    const status = useSignal<State>(0);

    return (
        <>
            <h2>Room: {roomId}</h2>
            <p>Game content goes here</p>
            <main>
                <GameIsland roomId={roomId} status={status} >
                    <QuestionBox position="left" />
                    <QuestionBox position="right" />
                    <Timer />
                </GameIsland>
            </main>
        </>
    );
});