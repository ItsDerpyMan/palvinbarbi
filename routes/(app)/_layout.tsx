import { define } from "../../utils/utils.ts";

export default define.layout((props) => (
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Would you Rather</title>
    </head>
    <body f-client-nav>
        <props.Component />
    </body>
    </html>
));