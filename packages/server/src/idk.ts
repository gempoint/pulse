import { Hono } from "hono";
import prisma from "./prisma";
import { ba, flatten, go, SECRET } from "./utils";
import safeAwait from "safe-await";
import { verify } from "hono/jwt";

const app = new Hono()

app.get('/search/:name', async (c) => {
  let auth = c.req.header("Authorization");
  console.log(auth);
  if (!auth) {
    return ba(c, "no auth token");
  }
  auth = auth.replace("Bearer ", "");
  //console.log(auth)

  const [err, dat] = await safeAwait(verify(auth, SECRET as unknown as string));
  if (err) {
    console.log(err);
    return ba(c, "bad token");
  }
  let name = c.req.param('name')
  let dat_ = await prisma.user.findMany({
    where: {
      name: {
        contains: name
      }
    },
    select: {
      _count: {
        select: {
          friends: true
        }
      },
      bio: true,
      name: true,
      verified: true,
      pfp: true
    }
  })
  return go(c, dat_.map(x => flatten(x)));
})

export default app