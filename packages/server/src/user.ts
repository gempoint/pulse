// @ts-ignore
// @ts-ignore
// @ts-ignore

import { Hono } from "hono";
import { auth, ba, DEFAULT_IMG, freshSDK, go, validate } from "./utils";
import prisma from "./prisma";
import _, { cond } from "lodash";
import { unknown, z } from "zod";
import ProfileCardRenderer from "./components/ProfileCardRenderer";
import safeAwait from "safe-await";
import Expo from "expo-server-sdk";
import addNotif from "./notifications.ts";
import { Profile, User } from "../prisma/drizzle/schema.ts";
import { ilike, like, or, sql, and, not, eq } from "drizzle-orm";
import { AxiosError } from 'axios';

const app = new Hono();

const userUpdate = z.object({
	bio: z.string().optional(),
	color: z.string().optional(),
	name: z.string().optional(),
	username: z.string().optional(),
	pfp: z.string().optional(),
	token: z.string().optional(),
});

app.get("/me", auth(), async (c) => {
	const user = await prisma.profile.findUnique({
		where: { id: c.get("id") },
		// omit: {
		//   state: true,
		// },
		include: {
			_count: {
				select: {
					friends: true,
				},
			},
		},
	});
	// @ts-ignore
	user!.friends = user?._count.friends;
	// @ts-ignore
	delete user?._count;
	return go(c, user);
});

app.get("/me/stats", auth(), async (c) => {
	return c.redirect(`/user/get/${c.get("id")}/stats`);
});

app.post("/me", validate("json", userUpdate), auth(), async (c) => {
	const v = c.req.valid("json");

	console.log("v", v);

	let past = await prisma.user.findUnique({
		where: {
			id: c.get("id"),
		},
	});

	for (const [key, value] of Object.entries(v)) {
		switch (key) {
			case "pfp":
				try {
					new URL(value as string);
				} catch (e) {
					return ba(c, unknown);
				}
				break;
			case "color":
				try {
					const reg = /^#([0-9a-f]{3}){1,2}$/i;
					if (!reg.test(value as string)) {
						return ba(c, unknown);
					}
				} catch (e) {
					return ba(c, unknown);
				}
				break;
			case "token":
				try {
					if (!Expo.isExpoPushToken(value)) {
						return ba(c, unknown);
					}
				} catch (e) {
					return ba(c, unknown);
				}
				break;
		}
	}
	console.log(past);
	let i;
	past?.finished ? (i = undefined) : (i = true);
	let z = v;
	//delete z.token
	console.log(i);
	let data = await prisma.profile.update({
		where: {
			id: c.get("id"),
		},
		data: {
			..._.omit(v, "token"),
			user: {
				update: {
					finished: true,
					token: v.token,
				},
			},
		},
	});

	return go(c, data);
});

app.get("/friends", auth(), async (c) => {
	let data = await prisma.profile.findMany({
		where: {
			friends: {
				some: {
					id: c.get("id"),
				},
			},
		},
	});

	//let data = await prisma.user.findFirst({
	//	where: {
	//		id: dat.id
	//	},
	//	include: {
	//		friends: true
	//	}
	//})
	console.log("friends", data);
	//return go(c, data.filter((item) =>
	//	SAFE_VALUES.some((key) => item.hasOwnProperty(key))
	//))
	return go(c, data);
});

app.get("/valid/:name", async (c) => {
	let name = c.req.param("name");
	console.log(name);
	let dat = await prisma.profile.findFirst({
		where: {
			username: name,
		},
	});
	console.log(dat);
	if (dat === null) {
		return go(c, undefined);
	} else {
		return ba(c, undefined);
	}
});

app.get("/notifications", auth(), async (c) => {
	let data = await prisma.profile.findFirst({
		where: {
			id: c.get("id"),
		},
		include: {
			incomingReq: true,
		},
	});

	return go(c, data?.incomingReq);
});

app.get("/notifications/:id", auth(), async (c) => {
	let id = c.req.param("id");

	let data = await prisma.profile.findFirst({
		where: {
			id: c.get("id"),
		},
		include: {
			incomingReq: true,
		},
	});

	if (data?.incomingReq.find((el) => el.id === id)) {
		await prisma.profile.update({
			where: {
				id: c.get("id"),
			},
			data: {
				incomingReq: {
					disconnect: {
						id,
					},
				},
				friends: {
					connect: {
						id,
					},
				},
			},
		});
		return go(c, unknown);
	} else {
		return ba(c, {
			type: "NOT_FOUND",
		});
	}
});

app.delete("/notifications/:id", auth(), async (c) => {
	let id = c.req.param("id");

	let data = await prisma.profile.findFirst({
		where: {
			id: c.get("id"),
		},
		include: {
			incomingReq: true,
		},
	});

	if (data?.incomingReq.find((el) => el.id === id)) {
		await prisma.profile.update({
			where: {
				id: c.get("id"),
			},
			data: {
				incomingReq: {
					disconnect: {
						id,
					},
				},
			},
		});
		return go(c, undefined);
	} else {
		return ba(c, {
			type: "NOT_FOUND",
		});
	}
});

app.post("/add/:id", auth(), async (c) => {
	let id = c.req.param("id");

	let data = await prisma.profile.findFirst({
		where: {
			id,
		},
		select: {
			user: true,
		},
	});

	if (data !== null) {
		await prisma.profile.update({
			where: {
				id,
			},
			data: {
				incomingReq: {
					connect: {
						id: c.get("id"),
					},
				},
			},
		});
		if (data.user.token) {
			addNotif({
				to: data.user.token,
				body: "someone added you!",
				data: {
					id: data.id,
					page: "/notifications",
				},
			});
		}
		return go(c, undefined);
	} else {
		return ba(c, {
			type: "NOT_FOUND",
		});
	}
});

app.delete("/add/:id", auth(), async (c) => {
	let id = c.req.param("id");

	let data = await prisma.profile.findFirst({
		where: {
			id,
		},
	});

	if (data !== null) {
		await prisma.profile.update({
			where: {
				id,
			},
			data: {
				incomingReq: {
					disconnect: {
						id: c.get("id"),
					},
				},
			},
		});
		return go(c, undefined);
	} else {
		return ba(c, {
			type: "NOT_FOUND",
		});
	}
});

app.get("/png", auth(), async (c) => {
	let profile = await prisma.profile.findFirst({
		where: {
			id: c.get("id"),
		},
	});

	try {
		const renderer = new ProfileCardRenderer();
		const png = await renderer.render(profile);
		//console.log(png)
		//return new Response(png, {
		//	headers: {
		//		'Content-Type': 'image/png',
		//		'Cache-Control': 'public, max-age=3600'
		//	}
		//});
		return go(c, {
			png: png,
		});
	} catch (err) {
		console.error(err);
	}
});

app.get("/search/:name", auth(true), async (c) => {
	let name = c.req.param("name");
	let id = c.get("id");
	console.log("id", id)
	//let data = await prisma.$drizzle
	//	.select()
	//	.from(Profile)
	//	//.where(
	//	//or(sql`to_tsvector('english', ${Profile.name}) @@ to_tsquery('english', ${name})`, sql`to_tsvector('english', ${Profile.username}) @@ to_tsquery('english', %${name}%)`)
	//	//)
	//	//.where(sql`similarity(${Profile.name}, ${name}) > 0.3`)
	//	.where(
	//		and(
	//			or(
	//				ilike(Profile.username, `%${name}%`),
	//				ilike(Profile.name, `%${name}%`),
	//			),
	//			id ? not(eq(Profile.id, id)) : undefined
	//		),
	//	)
	let data = await prisma.profile.findMany({
		where: {
			OR: [
				{
					username: {
						contains: name
					}
				},
				{
					name: {
						contains: name
					}
				},
			],
			NOT: {
				id: {
					equals: id
				}
			}
		},
		include: {
			incomingReq: {
				select: {
					id: true
				}
			}
		}
	})
	if (data.length !== 0) {
		data.forEach(user => {
			console.log(user.incomingReq)
			// for some reason this doesnt work?
			//let condition = user.incomingReq.includes({ id: "ikxq2xc2hidigygfejcnyydfx" })
			//let condition = _.includes(user.incomingReq, { id: id })
			// why tf does this work but nothing else does
			let condition = user.incomingReq.some(er => er.id === id)
			console.log("condition", condition)
			if (condition) {
				user.pending = true
			} else {
				user.pending = false
			}
			delete user.incomingReq
		})
	}
	console.log("search", data);
	return go(c, data);
});

app.get("/get/:id", auth(true), async (c) => {
	let id = c.req.param("id");
	let [err, data] = await safeAwait(
		prisma.profile.findUnique({
			where: {
				id,
			},
			include: {
				_count: {
					select: {
						friends: true,
					},
				},
				friends: {},
			},
		}),
	);
	// console.log(data);
	if (data !== null) {
		// friend test
		let test = await prisma.profile.findFirst({
			where: {
				id,
				friends: {
					some: {
						id: c.get("id"),
					},
				},
			},
		});
		console.log("t", test);
		// @ts-ignore
		data.isFriend = test !== null;

		let pending = await prisma.profile.findFirst({
			where: {
				id,
				incomingReq: {
					some: {
						id: c.get("id"),
					},
				},
			},
		});
		// @ts-ignore
		data.isPending = pending !== null;
	} else {
		return ba(c, {
			type: "NOT_FOUND",
		});
	}
	// @ts-ignore
	data!.friends = data?._count.friends;
	// @ts-ignore
	delete data?._count;
	return go(c, data);
});

app.get("/get/:id/friends", auth(true), async (c) => {
	let id = c.req.param("id");
	let [err, data] = await safeAwait(
		prisma.profile.findMany({
			where: {
				friends: {
					some: {
						id,
					},
				},
			},
		}),
	);
	if (data === null) {
		return ba(c, {
			type: "NOT_FOUND",
		});
	}
	console.log(data);
	return go(c, data);
});

app.get("/get/:id/stats", auth(true), async (c) => {
	let id = c.req.param("id");
	let callId = c.get("id");
	let [err, data] = await safeAwait(
		prisma.profile.findUnique({
			where: {
				id,
			},
			include: {
				friends: {
					where: {
						id: callId,
					},
				},
				user: true,
			},
		}),
	);

	// if (data!.friends!.length > 0 || data?.id === callId) {
	if (true) {
		// is an actual friend
		// @ts-ignore
		let [err, sdk] = await safeAwait(freshSDK(data?.user!));
		if (err) {
			console.error(err);
		}
		let artists_ = await sdk?.currentUser.topItems(
			"artists",
			"medium_term",
			10,
		);
		let songs_ = await sdk?.currentUser.topItems("tracks", "medium_term", 10);
		if (artists_?.items.length === 0 && songs_?.items.length === 0) {
			return go(c, {
				artists: [],
				songs: [],
			});
		}
		const artists = artists_!.items.map((artist) => {
			return {
				name: artist.name,
				//image: "f",
				image:
					artist.images.length === 0
						? DEFAULT_IMG
						: artist.images.sort((a, b) => (a > b ? -1 : 1))[0].url,
				uri: artist.uri,
				url: artist.external_urls.spotify,
			};
		});

		const songs = songs_?.items.map((item) => {
			return {
				name: item.name,
				image:
					item.album.images.length === 0
						? DEFAULT_IMG
						: item.album.images.sort((a, b) => (a > b ? -1 : 1))[0].url,
				uri: item.uri,
				url: item.external_urls.spotify,
			};
		});
		return go(c, {
			artists: artists,
			songs: songs,
		});
		//@ts-ignore
	} else {
		return ba(c, {
			type: "NOT_A_FRIEND",
		});
	}
});

export default app;
