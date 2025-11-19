import { Partial } from "fresh/runtime";
import { PageProps } from "fresh";

export default function Main({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="../../assets/main_styles.css" />
        <title>Room</title>
      </head>
      <body f-client-nav>
        <nav>
          <header>
            <h1>Would You Rather</h1>
          </header>
        </nav>
        <Partial name="main">
          <Component />
        </Partial>
        <footer>
          <h2>Hello</h2>
        </footer>
      </body>
    </html>
  );
}
