import { Hono } from "hono";
import {
	auth,
	ba,
	DEFAULT_IMG,
	flatten,
	freshSDK,
	go,
	SAFE_VALUES,
} from "./utils";
import prisma from "./prisma";
import _ from "lodash";
import { zValidator } from "@hono/zod-validator";
import { unknown, z } from "zod";
import ProfileCardRenderer from "./components/ProfileCardRenderer";
import safeAwait from "safe-await";

const app = new Hono();

const userUpdate = z.object({
	bio: z.string().optional(),
	color: z.string().optional(),
	name: z.string().optional(),
	username: z.string().optional(),
	pfp: z.string().optional(),
});

app.get("/me", auth(), async (c) => {
	const user = await prisma.profile.findUnique({
		where: { id: c.get("id") },
		include: {
			_count: {
				select: {
					friends: true,
				},
			},
		},
	});
	return go(c, user);
});

app.post("/me", zValidator("json", userUpdate), auth(), async (c) => {
	const v = c.req.valid("json");

	console.log(v);

	let past = await prisma.user.findUnique({
		where: {
			id: c.get("id"),
		},
	});

	for (const [key, value] of Object.entries(v)) {
		switch (key) {
			case "pfp":
				try {
					new URL(value);
				} catch (e) {
					return ba(c, unknown);
				}
				break;
			case "color":
				try {
					const reg = /^#([0-9a-f]{3}){1,2}$/i;
					if (!reg.test(value)) {
						return ba(c, unknown);
					}
				} catch (e) {
					return ba(c, unknown);
				}
		}
	}
	console.log(past);
	let i;
	past?.finished ? (i = undefined) : (i = true);
	console.log(i);
	let data = await prisma.profile.update({
		where: {
			id: c.get("id"),
		},
		data: {
			...v,
			user: {
				update: {
					finished: true,
				},
			},
		},
	});

	return go(c, _.pick(flatten(data), SAFE_VALUES));
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
	console.log("d", data);
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
			png: png
		})
	} catch (err) {
		console.error(err);
	}
});

app.get('/search/:name', auth(true), async (c) => {
	let name = c.req.param('name')
	let id = c.get('id')
	let data
	if (id) {
		data = await prisma.profile.findMany({
			where: {
				OR: [
					{ name: { contains: name } },
					{ username: { contains: name } }
				],
				//NOT: {
				//	id: id
				//},
				//friendsOf: {
				//	some: {
				//		friendsOf: {
				//			some: {
				//				id
				//			}
				//		}
				//	}
				//},


			},
			omit: {
				state: true
			}
		});
	} else {
		data = await prisma.profile.findMany({
			where: {
				name: {
					contains: name
				},
				username: {
					contains: name
				}
			},
			include: {
				_count: {
					select: {
						friends: true
					}
				},
			},
		})
	}
	console.log(data)
	return go(c, data);
})

app.get('/get/:id', auth(true), async (c) => {
	let id = c.req.param("id")
	let [err, data] = await safeAwait(prisma.profile.findUnique({
		where: {
			id
		},
		include: {
			_count: {
				select: {
					friends: true
				}
			},
		},
	}))
	console.log(data)
	if (data === null) {
		return ba(c, {
			type: 'NOT_FOUND'
		})
	}
	// @ts-ignore
	data!.friends = data?._count.friends
	// @ts-ignore
	delete data?._count
	return go(c, data);
})

app.get('/get/:id/friends', auth(true), async (c) => {
	let id = c.req.param("id")
	let [err, data] = await safeAwait(prisma.profile.findMany({
		where: {
			friends: {
				every: {
					id
				}
			}
		}
	}))
	if (data === null) {
		return ba(c, {
			type: 'NOT_FOUND'
		})
	}
	console.log(data)
	return go(c, data);
})

app.get('/get/:id/stats', auth(true), async (c) => {
	let id = c.req.param("id")
	let callId = c.get("id")
	let [err, data] = await safeAwait(prisma.profile.findUnique({
		where: {
			id
		},
		include: {
			friends: {
				where: {
					id: callId
				}
			},
			user: true
		}
	}))

	if (data?.friends.length > 0) {
		// is an actual friend
		// @ts-ignore
		let [err, sdk] = await safeAwait(freshSDK(data?.user!))
		if (err) {
			console.error(err)
		}
		let artists_ = await sdk?.currentUser.topItems("artists", "medium_term", 9)
		if (artists_.items.length === 0) {
			return go(c, [])
		}
		const artists = artists_!.items.map((artist) => {
			return {
				name: artist.name,
				//image: "f",
				image: artist.images.length === 0 ? DEFAULT_IMG : artist.images.sort((a, b) => a > b ? -1 : 1)[0].url,
				uri: artist.uri,
				url: artist.external_urls.spotify
			}
		})
		return go(c, artists)
	} else {
		return ba(c, {
			type: "NOT_A_FRIEND"
		})
	}
})

export default app;
