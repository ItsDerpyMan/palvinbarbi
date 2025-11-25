import RoomController from "../islands/RoomController.tsx";
import MainPage from "./index.tsx";
import { define } from "../utils/utils.ts";
import { Partial } from "fresh/runtime";

export default define.page(function App() {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Fresh app</title>
      </head>
      <body f-client-nav>
        <Partial name="body">
          <MainPage>
            <RoomController />
          </MainPage>
        </Partial>
      </body>
    </html>
  );
});
