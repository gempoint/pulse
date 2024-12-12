import Constants from "expo-constants";
import * as Device from "expo-device";
import _a, { AxiosError } from "axios";
import axios from "axios";
import { apiEndpoint } from "../constants/idk";
import * as SecureStore from "expo-secure-store";
import { PlaylistViewerProps } from "etc";
import { useToastController } from "@tamagui/toast";
import useSWRMutation from "swr/mutation";
import useSWR, { SWRConfiguration } from "swr";

export interface APIResponse<B, T> {
  ok: B;
  msg: T;
}

interface RadarError {
  type: "NO_PREMIUM" | "NO_PLAYER";
}

interface RadarFinal {
  good: number;
  bad: number;
}

export type State = {
  id: string;
  name: string;
  artist: string;
  img: string;
  color?: string;
  uri: string;
  url: string;
};

export interface User {
  id: string;
  pfp: string;
  name: string;
  username: string;
  verified: boolean;
  staff: boolean;
  artist: boolean;
  color: string;
  bio: string;
  friends?: number;
  state?: State;
  createdAt: string;
  isFriend: boolean;
  pending: boolean
  friend: boolean
}

export interface StatInfo {
  name: string;
  image: string;
  uri: string;
  url: string;
}

axios.interceptors.response.use((res) => {
  const toastController = useToastController();
  if (res.data.msg.err) {
    toastController.show(res.data.msg.err, {
      customData: {
        error: true,
      },
    });
  }
  return res;
});

export const a = _a.create({
  baseURL: apiEndpoint(),
  httpAgent: `${Constants.expoConfig?.name}-client ${Constants.expoConfig?.version} ${Device.osName}`,
});

const post = <T>(url: string, data: unknown) =>
  useSWRMutation(url, async (url, opts) =>
    a.post<T>(url, opts, {
      headers: {
        Authorization: `Bearer ${(await SecureStore.getItemAsync("TOKEN")) as string}`,
      },
    }),
  );

//const get = <T>(url: string, opts?: SWRConfiguration) =>
//  useSWR(
//    url,
//    async (url) =>
//      a
//        .get<T>(url, {
//          headers: {
//            Authorization: `Bearer ${(await SecureStore.getItemAsync("TOKEN")) as string}`,
//          },
//        })
//        .then((res) => res.data),
//    opts,
//  );


const get = <T>(url: string | null, opts?: SWRConfiguration) => useSWR(url, async (url) => {
  a.get<T>(url, {
    headers: {
      Authorization: `Bearer ${(await SecureStore.getItemAsync("TOKEN")) as string}`,
    },
  }).catch((err_: Error | AxiosError) => {
    let err = new Error("failed to fetch")
    if (axios.isAxiosError(err_)) {
      // @ts-ignore
      err.name = err_.cause?.name
      // @ts-ignore
      err.info = err_.toJSON()
      // @ts-ignore
      err.status = err_.status
      // Access to config, request, and response
    } else {
      // Just a stock error
      // @ts-ignore
      err.info = err_
    }
    throw err
  }).then((res) => res.data)

})

export const verifyToken = async (x: string) => {
  let y = await a.get<APIResponse<boolean, unknown>>("/valid", {
    headers: { Authorization: `Bearer ${x}` },
  });
  console.log("daty", y.data);
  if (y.data.ok === true) {
    return true;
  } else return false;
};

export const radar = async (lat: number, long: number) => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.post<
    APIResponse<true, PlaylistViewerProps> | APIResponse<false, RadarError>
  >(
    "/radar/fetch",
    {
      lat,
      long,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return y.data;
  //return post<APIResponse<true, PlaylistViewerProps> | APIResponse<false, RadarError>>('/radar/fetch', {
  //  lat, long
  //})
};

export const radarFinal = async (songs: string[]) => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.post<
    APIResponse<true, RadarFinal> | APIResponse<false, RadarError>
  >(
    "/radar/finish",
    {
      songs,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return y.data;
};

export const radarAdd = async (lat: number, long: number) => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.post<APIResponse<true, undefined>>(
    "/radar/add",
    {
      lat,
      long,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return y.data;
  //return post<APIResponse<true, PlaylistViewerProps> | APIResponse<false, RadarError>>('/radar/fetch', {
  //  lat, long
  //})
};
export const userFetch = (...args: [string | undefined, SWRConfiguration]) => {
  //let token = await SecureStore.getItemAsync('TOKEN') as string
  //let url = id ? `/ user / get / ${id}` : ` / user / me`
  //let y = await a.get<APIResponse<true, User>>(url, {
  //  headers: {
  //    'Authorization': `Bearer ${token}`
  //  }
  //})
  //return y.data
  return get<APIResponse<true, User>>(
    args[0]?.length !== 0 ? `/user/get/${args[0]}` : `/user/me`,
    args[1],
  );
};

export const userUpdate = async (x: Partial<User>) => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.post<APIResponse<true, User>>("/user/me", x, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return y.data;
};

export const checkUsernameValid = async (name: string) => {
  let y = await a.get<APIResponse<true, unknown>>(`/user/valid/${name}`);
  return y.data.ok;
};

export const fetchFriends = (...args: [SWRConfiguration | undefined]) => {
  // let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  // let y = await a.get<APIResponse<true, User[]>>("/user/friends", {
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  // });
  // return y.data;
  return get<APIResponse<true, User[]>>(`/user/friends`, args[0]);
};

export const fetchNotifs = async () => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.get<APIResponse<true, User[]>>("/user/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return y.data;
};

export const acceptFriReq = async (id: string) => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.get<
    | APIResponse<true, undefined>
    | APIResponse<
      false,
      {
        type: string;
      }
    >
  >(`/user/notifications/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return y.data;
};

export const declineFriReq = async (id: string) => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.delete<
    | APIResponse<true, undefined>
    | APIResponse<
      false,
      {
        type: string;
      }
    >
  >(`/ user / notifications / ${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return y.data;
};

export const sendFriReq = async (id: string) => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  console.log("t", token);
  let y = await a.post<
    | APIResponse<true, undefined>
    | APIResponse<
      false,
      {
        type: string;
      }
    >
  >(
    `/user/add/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  console.log(y.data);
  return y.data;
};

export const fetchUserPN = async () => {
  console.log(1);
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.get<
    APIResponse<
      true,
      {
        png: string;
      }
    >
  >("/user/png", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return y.data;
};

export const searchUsers = (...args: [string, SWRConfiguration]) => {
  //let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  //let y = await a.get<APIResponse<true, User[]>>(`/user/search/${x}`, {
  //  headers: {
  //    Authorization: `Bearer ${token}`,
  //  },
  //});
  //return y.data;
  return get<APIResponse<true, User[]>>(`/user/search/${args[0]}`, args[1])
};

export const fetchUserFriends = async (x: string) => {
  let token = (await SecureStore.getItemAsync("TOKEN")) as string;
  let y = await a.get<APIResponse<true, User[]>>(`/user/get/${x}/friends`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return y.data;
};

export const fetchUserStats = (...args: [string, SWRConfiguration]) => {
  //let token = await SecureStore.getItemAsync('TOKEN') as string
  //let y = await a.get<APIResponse<true, Artist[] | []> | APIResponse<false, { type: string }>>(`/user/get/${x}/stats`, {
  //  headers: {
  //    'Authorization': `Bearer ${token}`
  //  }
  //})
  //return y.data
  return get<
    | APIResponse<
      true,
      {
        artists: StatInfo[] | [];
        songs: StatInfo[] | [];
      }
    >
    | APIResponse<
      false,
      {
        type: string;
      }
    >
  >(
    args[0] ? args[0].length === 0 ? `/user/me/stats` : `/user/get/${args[0]}/stats` : null,
    args[1],
  );
};

export const ping = async () => {
  try {
    await a.get("/");
    return true;
  } catch (err) {
    return false;
  }
};
