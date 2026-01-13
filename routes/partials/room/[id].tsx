import { Partial } from "fresh/runtime";
import RoomIsland from "../../../islands/RoomIsland.tsx";
import {define} from "../../../handlers/utils/utils.ts";

export default define.page(({params}) => {
    return (
        <Partial name={`room-${params.id}`}>
            <RoomIsland roomId={params.id} ></RoomIsland>
        </Partial>
    )
})