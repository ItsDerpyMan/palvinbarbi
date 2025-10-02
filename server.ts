import { serveDir, serveFile } from "jsr:@std/http/file-server";
import { Select } from "@cliffy/prompt/select";
import { tty } from "@cliffy/ansi/tty";
import { keypress, KeyPressEvent } from "@cliffy/keypress";
import { iterId, Room, Rooms } from "./server/rooms.ts";
import * as log from "@std/log";

const ROOMS: Rooms = new Rooms();
const ROUTES: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/users/:user" }),
    handler: (_req: Request, match: URLPatternResult) => {
      console.log(`user: ${match.pathname.groups.user}`);
      return new Response("ok"); // <== added
    },
  },
  {
    pattern: new URLPattern({ pathname: "/rooms/:id" }),
    handler: (req: Request, match: URLPatternResult) =>
      upgradeRoomWebSocket(req, match.pathname.groups.id),
  },
  {
    pattern: new URLPattern({ pathname: "/rooms" }),
    handler: (_req: Request, _match: URLPatternResult) => getRooms(),
  },
  {
    pattern: new URLPattern({ pathname: "/home" }),
    handler: (req: Request, _match: URLPatternResult) => getHomePage(req),
  },
  {
    pattern: new URLPattern({ pathname: "/favicon.ico" }),
    handler: (_req: Request, _match: URLPatternResult) => {
      return new Response(null, { status: 204 });
    },
  },
];
type Handler = (
  req: Request,
  match: URLPatternResult,
) => Response | Promise<Response>;

interface Route {
  pattern: URLPattern;
  handler: Handler;
}
export async function waitTillEnter(): Promise<void> {
  console.log("Press <Enter> to continue.");

  // Wrap one keypress event in a promise
  for await (const key of keypress()) {
    if (key.ctrlKey && key.key === "c") {
      console.log("exit");
      Deno.exit();
    }

    if (key.key === "return") {
      break;
    }
  }
}

async function main(): Promise<void> {
  const id: iterId = new iterId();

  while (true) {
    const result: string = await Select.prompt({
      message: "Configuration",
      options: [
        { name: "new room", value: "new-room" },
        { name: "list rooms", value: "list-rooms" },
        { name: "remove room", value: "rem-room" },
        Select.separator("--------"),
        { name: "announcement", value: "message" },
        { name: "stop", value: "stop" },
      ],
    });
    switch (result) {
      case "new-room": {
        const room = new Room(id);
        ROOMS.push(room);
        break;
      }
      case "list-rooms": {
        for (const room of ROOMS) {
          console.log(room.toString());
        }
        await waitTillEnter();
        break;
      }
      case "rem-room": {
        break;
      }
      case "message": {
        console.log("Hiii");
        break;
      }
      case "stop": {
        Deno.exit()
        break;
      }
    }
    tty.cursorSave
      .cursorHide
      .cursorTo(0, 0)
      .eraseScreen();
  }
}
async function getRooms(): Promise<Response> {
  const room_data = ROOMS.getRooms();
  return new Response(room_data, {
    headers: { "Content-Type": "application/json" },
  });
}
async function upgradeRoomWebSocket(
  req: Request,
  id: string | undefined,
): Promise<Response> {
  if (req.headers.get("upgrade") != "websocket" || typeof id != "string") {
    return new Response(null, { status: 426 });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.addEventListener("open", () => {
    console.log(`A new user connected to ${id} room`);
  });
  socket.addEventListener("message", (event) => {
    if (event.data === "ping") {
      socket.send("pong");
    }
  });

  return response;
}
async function getHomePage(req: Request): Promise<Response> {
  return await serveFile(req, "./client/index.html");
}
Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  for (const route of ROUTES) {
    if (route.pattern.test(url)) {
      const match = route.pattern.exec(url);
      if (match === null) break;
      return route.handler(req, match);
    }
  }

  const res = await serveDir(req, {
    fsRoot: "./client",
    urlRoot: "",
    showDirListing: false,
  });
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", "no-store");
  headers.delete("ETag");

  log.debug(`Request: ${req} \n url: ${url}`);
  const body = await res.arrayBuffer();
  log.debug(`Response: ${body}`);
  return new Response(body, { status: res.status, headers });
});

main();
