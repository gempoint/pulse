import { Hono } from "hono";
import {
	a,
	AUTH_HEADER,
	ba,
	DEFAULT_IMG,
	flatten,
	go,
	MyDeserializer,
	SAFE_VALUES,
	SECRET,
	SPOTIFY_CLIENT_ID,
} from "./utils";
import safeAwait from "safe-await";
import { verify } from "hono/jwt";
import prisma from "./prisma";
import type { AxiosError } from "axios";
import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import _ from "lodash";
import { zValidator } from "@hono/zod-validator";
import { unknown, z } from "zod";

const app = new Hono();

const userUpdate = z.object({
	bio: z.string().optional(),
	color: z.string().optional(),
	name: z.string().optional(),
	username: z.string().optional(),
	pfp: z.string().optional()
})


app.get("/me", async (c) => {
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

	const user = await prisma.user.findUnique({
		where: { id: dat.id as unknown as string },
		include: {
			_count: {
				select: {
					friends: true,
				},
			},
		},
	});

	console.log(user?.id);
	console.log("getting token");
	const [e_, keys] = await safeAwait(
		a.post<AccessToken>(
			"https://accounts.spotify.com/api/token",
			{
				grant_type: "refresh_token",
				refresh_token: user!.refresh_token,
				//client_id: Bun.env.SPOTIFY_CLIENT_ID
			},
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: AUTH_HEADER,
				},
			},
		),
	);
	if (e_) {
		const errors = e_ as Error | AxiosError;
		if (axios.isAxiosError(errors)) {
			if (errors.response) {
				console.log("get token errored out");
				console.error(errors.response.data);
			}
		}
	}

	let { data } = keys!;
	//console.log(data)

	console.log("spotify sdk");
	const mainUser = SpotifyApi.withAccessToken(
		SPOTIFY_CLIENT_ID!,
		{
			access_token: data.access_token,
			expires_in: data.expires_in,
			refresh_token: user?.refresh_token!,
			token_type: "Bearer",
		},
		{
			// https://github.com/spotify/spotify-web-api-ts-sdk/issues/127 ¯\_(ツ)_/¯
			deserializer: new MyDeserializer(),
		},
	);

	const [er, profile] = await safeAwait(mainUser.currentUser.profile());
	if (er) {
		console.error(er);
	}

	return go(c, {
		..._.pick(flatten(user), [
			"id",
			"verified",
			"staff",
			"artist",
			"friends",
			"bio",
			"color",
			"name",
			"username",
			"pfp"
		])
	});
})



app.post("/me", zValidator('json', userUpdate), async (c) => {
	const v = c.req.valid('json')
	let auth = c.req.header('Authorization')
	console.log(auth)
	if (!auth) {
		return ba(c, 'no auth token')
	}
	auth = auth.replace('Bearer ', '')
	//console.log(auth)

	const [err, dat] = await safeAwait(verify(auth, (SECRET as unknown as string)))
	if (err) {
		console.log(err)
		return ba(c, 'bad token')
	}
	console.log(v)

	let past = await prisma.user.findUnique({
		where: {
			id: dat!.id as unknown as string
		}
	})

	for (const [key, value] of Object.entries(v)) {
		switch (key) {
			case 'pfp':
				try {
					new URL(value)
				} catch (e) {
					return ba(c, unknown)
				}
				break;
			case 'color':
				try {
					var reg = /^#([0-9a-f]{3}){1,2}$/i;
					if (!reg.test(value)) {
						return ba(c, unknown)
					}
				} catch (e) {
					return ba(c, unknown)
				}
		}
	}
	console.log(past)
	let i
	past?.finished ? i = undefined : i = true
	console.log(i)
	let data = await prisma.user.update({
		where: {
			id: dat!.id as unknown as string,
		},
		data: {
			...v,
			finished: i
		}
	})

	return go(c, _.pick(flatten(data), SAFE_VALUES))
})

app.get('/friends', async (c) => {
	let auth = c.req.header('Authorization')
	console.log(auth)
	if (!auth) {
		return ba(c, 'no auth token')
	}
	auth = auth.replace('Bearer ', '')
	//console.log(auth)

	const [err, dat] = await safeAwait(verify(auth, (SECRET as unknown as string)))
	if (err) {
		console.log(err)
		return ba(c, 'bad token')
	}

	console.log(dat)
	let data = await prisma.user.findMany({
		where: {
			friends: {
				some: {
					id: dat.id
				}
			}
		}
	})

	//let data = await prisma.user.findFirst({
	//	where: {
	//		id: dat.id
	//	},
	//	include: {
	//		friends: true
	//	}
	//})
	console.log('d', data)
	//return go(c, data.filter((item) =>
	//	SAFE_VALUES.some((key) => item.hasOwnProperty(key))
	//))
	return go(c, data.map((item) => _.pick(item, SAFE_VALUES)))
})

app.get('/valid/:name', async (c) => {
	let name = c.req.param('name')
	console.log(name)
	let dat = await prisma.user.findFirst({
		where: {
			username: name,
		}
	})
	console.log(dat)
	if (dat === null) {
		return go(c, undefined)
	} else {
		return ba(c, undefined)
	}
})

app.get('/notifications', async (c) => {
	let auth = c.req.header('Authorization')
	console.log(auth)
	if (!auth) {
		return ba(c, 'no auth token')
	}
	auth = auth.replace('Bearer ', '')
	//console.log(auth)

	const [err, dat] = await safeAwait(verify(auth, (SECRET as unknown as string)))
	if (err) {
		console.log(err)
		return ba(c, 'bad token')
	}
	let data = await prisma.user.findFirst({
		where: {
			id: dat.id as unknown as string,
		},
		include: {
			incomingReq: true
		}
	})

	return go(c, data?.incomingReq.map((item) => _.pick(item, SAFE_VALUES)))
})

app.get('/notifications/:id', async (c) => {
	let id = c.req.param('id')
	let auth = c.req.header('Authorization')
	console.log(auth)
	if (!auth) {
		return ba(c, 'no auth token')
	}
	auth = auth.replace('Bearer ', '')
	//console.log(auth)

	const [err, dat] = await safeAwait(verify(auth, (SECRET as unknown as string)))
	if (err) {
		console.log(err)
		return ba(c, 'bad token')
	}

	let data = await prisma.user.findFirst({
		where: {
			id: dat.id as unknown as string,
		},
		include: {
			incomingReq: true
		}
	})

	if (data?.incomingReq.find(el => el.id === id)) {
		await prisma.user.update({
			where: {
				id: dat.id as unknown as string,
			},
			data: {
				incomingReq: {
					disconnect: {
						id
					}
				},
				friends: {
					connect: {
						id
					}
				}
			}
		})
		return go(c, unknown)
	} else {
		return ba(c, {
			type: 'NOT_FOUND'
		})
	}
})

app.delete('/notifications/:id', async (c) => {
	let id = c.req.param('id')
	let auth = c.req.header('Authorization')
	console.log(auth)
	if (!auth) {
		return ba(c, 'no auth token')
	}
	auth = auth.replace('Bearer ', '')
	//console.log(auth)

	const [err, dat] = await safeAwait(verify(auth, (SECRET as unknown as string)))
	if (err) {
		console.log(err)
		return ba(c, 'bad token')
	}

	let data = await prisma.user.findFirst({
		where: {
			id: dat.id as unknown as string,
		},
		include: {
			incomingReq: true
		}
	})

	if (data?.incomingReq.find(el => el.id === id)) {
		await prisma.user.update({
			where: {
				id: dat.id as unknown as string,
			},
			data: {
				incomingReq: {
					disconnect: {
						id
					}
				},
			}
		})
		return go(c, undefined)
	} else {
		return ba(c, {
			type: 'NOT_FOUND'
		})
	}
})

app.post('/add/:id', async (c) => {
	let id = c.req.param('id')
	let auth = c.req.header('Authorization')
	console.log(auth)
	if (!auth) {
		return ba(c, 'no auth token')
	}
	auth = auth.replace('Bearer ', '')
	//console.log(auth)

	const [err, dat] = await safeAwait(verify(auth, (SECRET as unknown as string)))
	if (err) {
		console.log(err)
		return ba(c, 'bad token')
	}

	let data = await prisma.user.findFirst({
		where: {
			id
		},
	})

	if (data !== null) {
		await prisma.user.update({
			where: {
				id
			},
			data: {
				incomingReq: {
					connect: {
						id: dat.id as unknown as string
					}
				}
			}
		})
		return go(c, undefined)
	} else {
		return ba(c, {
			type: 'NOT_FOUND'
		})
	}
})

export default app;
