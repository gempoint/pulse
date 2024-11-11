import { Hono } from "hono";
import { logger } from "hono/logger";

import { sentry } from "@hono/sentry";

import radar from "./radar";
import user from "./user";
import auth from "./auth";
import { showRoutes } from "hono/dev";

const app = new Hono();

app.use(logger());
app.use("*", sentry());

app.onError((err, c) => {
  console.error(err);
  return c.json({
    msg: {
      'err': err.message
    },
    ok: false,
  });
});

app.get("/", (c) => c.text("sadly i run"));

app.route("/user", user);

app.route("/", auth);

app.route("/", radar);

//showRoutes(app, {
//  verbose: true,
//})


Bun.serve({
  fetch: app.fetch,
  port: 3000,
});


//export default app
