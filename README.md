# untitledradarappstack

## Folder Structure

- `packages/`
  - `app` - (do i even gotta explain) built w/ expo & react native
  - `etc` - random stuff aka assets for app like icons and theme
  - `server` - (where most of the work is done) built w/ [hono](https://hono.dev/), [prisma](https://www.prisma.io/) and 2 braincells at 3am
  - `realtime_ex` - hopefully when this app/company/idk grows, we can switch from a js runtime to elixir runtime for better realtime(ws) performance [guide for elixir](https://binarynoggin.com/blog/add-raw-websockets-in-phoenix/)


## Docs/random bits of info

* spotify api is very strict so it might say `INVALID_REDIRECT_URI` when doing some stuff ![show and tell](/docs/image.png)
* technically this could be ported to web but bffr whos gonna access this as a website
* we need better ui for the app goddamn
* there might be some bugs/security issues with auth (oops)
* might not ever be a ios version unless i dev and build on a mac vm (not doing that)
* for the love of everything that [linux runs on](https://www.youtube.com/watch?v=dQw4w9WgXcQ), dont use yarn or npm but use [bun](https://bun.sh/)
* realistically there prob isnt a need for a realtime api if we want to build a "radar" like app
  * aka user polls for data when they want to and we could keep a autodeleting (prob 1 hr leeway) key-value db for keeping track of loc and corresponding user dat for realistic radar feel
  * randomly thought of at 12:18am 

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.24. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
