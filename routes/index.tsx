import { useSignal } from "@preact/signals";
import { Head } from "fresh/runtime";
import { Button} from "../components/Button.tsx"
export default function Home() {

  return (
    <div class="px-4 py-8 mx-auto fresh-gradient min-h-screen">
      <Head>
        <title>Fresh counter</title>
      </Head>
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <h1 class="text-4xl font-bold">Welcome to Fresh</h1>
      </div>
      <div class="flex flex-col items-center justify-center">
        <h2>Hello</h2>
      </div>
    </div>
  );
}
