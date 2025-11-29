// components/HomePage.tsx
import { ComponentChildren } from "preact";
import RoomController from "../islands/RoomController.tsx";

interface HomePageProps {
  children?: ComponentChildren;
}

export default function HomePage({ children }: HomePageProps) {
  return (
    <main class="px-4 py-8 mx-auto fresh-gradient min-h-screen">
      <h1 class="text-4xl font-bold mb-6">Would You Rather</h1>
      <section class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <RoomController />
        {children}
      </section>
    </main>
  );
}
