import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Head } from "fresh/runtime";
import RoomList from "../islands/Room-list.tsx";
import Test from "../islands/test";
import { PageProps } from "$fresh/server.ts";
import { baseUrl} from "../utils";

export default function Home({url}: PageProps) {
    console.log(url)
  return (
    <div class="px-4 py-8 mx-auto fresh-gradient min-h-screen">
      <Head>
        <title>WOULD YOU RATHER</title>
      </Head>

      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <h1 class="text-4xl font-bold mb-6">Room List</h1>
          <Test />
        <RoomList url={url.origin}/>
      </div>
    </div>
  );
}

