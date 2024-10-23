# untitledradarappstack [![wakatime](https://wakatime.com/badge/user/a3120ee8-8a1d-450b-b1ad-e300176a9657/project/5d0da85c-ed5c-4ed2-a804-9c015e66e59b.svg)](https://wakatime.com/badge/user/a3120ee8-8a1d-450b-b1ad-e300176a9657/project/5d0da85c-ed5c-4ed2-a804-9c015e66e59b)

## Folder Structure

- `packages/`
  - `app` - (do i even gotta explain) built w/ expo & react native
  - `etc` - random stuff aka assets for app like icons and theme
  - `server` - (where most of the work is done) built w/ [hono](https://hono.dev/), [prisma](https://www.prisma.io/) and 2 braincells at 3am
  - `realtime_ex` - hopefully when this app/company/idk grows, we can switch from a js runtime to elixir runtime for better realtime(ws) performance [guide for elixir](https://binarynoggin.com/blog/add-raw-websockets-in-phoenix/)


## Docs/random bits of info

* spotify api is very strict so it might say `INVALID_REDIRECT_URI` when doing some stuff ![show and tell](/docs/diagram_1.png)
* technically this could be ported to web but bffr whos gonna access this as a website
* we need better ui for the app goddamn
* there might be some bugs/security issues with auth (oops)
* might not ever be a ios version unless i dev and build on a mac vm (not doing that)
* for the love of everything that [linux runs on](https://www.youtube.com/watch?v=dQw4w9WgXcQ), dont use yarn or npm but use [bun](https://bun.sh/)
* why move to dragonflydb ![another show and tell](/docs/diagram_2.png)
  * might switch back to redis bc there might be some timeout issues when connecting
* should prob add more error checking in api but ¯\_(ツ)_/¯
* might switch to rust for api (last resort for better performance)
* for some reason it takes seconds to for like 5 users to analyse and return data even tho its written in rust (gotta improve that asap)
* need to add social features
* how tf does one improve api perfomance smh

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.24. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
