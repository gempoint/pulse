import type { ServerWebSocket } from "bun";
import type { Context } from "hono";
import type { WSContext, WSEvents } from "hono/ws";
import safeAwait from "safe-await";


const parseDat = async (x: unknown, ws: WSContext<ServerWebSocket<undefined>>) => {
  let [err, dat] = await safeAwait(parseAsync(x as string));

  console.log('e', err)
  console.log('d', dat)
  if (err) {
    throw err;
  }
}

const parseAsync = async (x: unknown) => {
  return new Promise((res, rej) => {
    try {
      let obj = JSON.parse(x as string);
      res(obj);
    } catch (e) {
      rej(e)
    }
  })
}


export default (c: Context<any, any, {}>): WSEvents<ServerWebSocket<undefined>> | Promise<WSEvents<ServerWebSocket<undefined>>> => {
  return {
    onMessage: async (event, ws) => {
      if (event.type === 'message') {
        //console.log(event)
        let [err, _] = await safeAwait(parseDat(event.data, ws))
        if (err) {

        }
      } else {
        //idk wtf it is
        ws.close(1003, 'da fuk is this?')
      }
      console.log(event)
    },
    onClose: () => {
      console.log('closed')
    }
  }
}

declare module 'bun' {
  interface ServerWebSocket {
    data: unknown
  }
}

