import { PageProps } from "fresh";
import {Auth, define} from "../../utils/utils.ts";

/**
 * Root Layout for Game App
 * Provides HTML structure and CSS for game layout
 */
export default function App({ Component }: PageProps<Auth>) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Would You Rather - Game</title>
      </head>
      <body>
          <header>
            <h1>Would You Rather</h1>
          </header>
          <MainLayout><Component/></MainLayout>
      </body>
    </html>
  );
}

export function MainLayout({ children }: { children: any }) {
  return (
      <div>
        Hello
        {children}
      </div>
  )
}