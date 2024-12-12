import { Hono } from "hono";
import { logger } from "hono/logger";
import { sentry } from "@hono/sentry";
import { cache } from 'hono/cache'
import { showRoutes } from "hono/dev";

import { fileTypeFromBuffer } from 'file-type';

import radar from "./radar";
import user from "./user";
import auth from "./auth";
import safeAwait from "safe-await";
import prisma from "./prisma";
import { ba } from "./utils";

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

app.route("/radar", radar);

app.get('/cdn/:id', async (c) => {
  let id = c.req.param("id");
  let [err, data] = await safeAwait(prisma.data.findFirst({
    where: { id }
  }))

  if (err) {
    return ba(c, {
      type: "ERR"
    })
  }

  if (data === null) {
    return ba(c, {
      type: "NOT_FOUND"
    })
  }

  return new Response(data?.data, {
    headers: {
      'Content-Type': (await fileTypeFromBuffer(data?.data.buffer! as unknown as ArrayBuffer))?.mime!,
      'Cache-Control': 'public, max-age=3600'
    }
  })
})

//showRoutes(app, {
//  verbose: true,
//})


Bun.serve({
  fetch: app.fetch,
  port: 3000,
});


//export default app
