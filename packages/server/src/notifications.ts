import type { ExpoPushMessage } from "expo-server-sdk";
import expo from "./expo";


let pastNotifs: ExpoPushMessage[] = []
let notifs: ExpoPushMessage[] = []

const sendNotifs = async () => {
  if (notifs.length !== 0) {
    let chunks = expo.chunkPushNotifications(notifs)
    let tickets = [];
    let skip = false
    for (let chunk of chunks) {
      if (skip) {
        continue
      }
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }
    notifs = []
  }
}

setInterval(sendNotifs, 5000)

const addNotif = (x: ExpoPushMessage) => {
  notifs.push(x);
}

export default addNotif