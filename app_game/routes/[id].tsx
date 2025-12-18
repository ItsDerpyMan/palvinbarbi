import { PageProps } from "fresh";
import { Auth, define } from "../../utils/utils.ts";

export default define.page(function RoomPage(props: PageProps<Auth>) {
  const roomId = props.params.id;

  return (
    <div>
      <h2>Room: {roomId}</h2>
      <p>Game content goes here</p>
    </div>
  );
});