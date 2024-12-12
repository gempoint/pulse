import { relations } from 'drizzle-orm'
import { boolean, foreignKey, jsonb, pgEnum, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

export const StatType = pgEnum('StatType', ['View'])

export const Stat = pgTable('Stat', {
	type: StatType('type').notNull(),
	special: text('special').notNull(),
	data: jsonb('data')
}, (Stat) => ({
	'Stat_cpk': primaryKey({
		name: 'Stat_cpk',
		columns: [Stat.type, Stat.special]
	})
}));

export const User = pgTable('User', {
	id: text('id').notNull().primaryKey(),
	flags: text('flags').array().notNull(),
	access_token: text('access_token').notNull(),
	refresh_token: text('refresh_token').notNull(),
	token: text('token').notNull(),
	public: boolean('public').notNull().default(true),
	finished: boolean('finished').notNull(),
	shadowed: boolean('shadowed').notNull(),
	extra: jsonb('extra').notNull().default("{}"),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
});

export const Profile = pgTable('Profile', {
	id: text('id').notNull().primaryKey(),
	pfp: text('pfp').notNull().default("https://i.scdn.co/image/ab676161000051747baf6a3e4e70248079e48c5a"),
	name: text('name').notNull().default("dummy_text"),
	username: text('username').notNull().unique().default("dummy_username"),
	verified: boolean('verified').notNull(),
	staff: boolean('staff').notNull(),
	artist: boolean('artist').notNull(),
	color: text('color').notNull().default("#EB459E"),
	bio: text('bio').notNull().default("im new to dis"),
	state: jsonb('state'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
}, (Profile) => ({
	'Profile_user_fkey': foreignKey({
		name: 'Profile_user_fkey',
		columns: [Profile.id],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Req = pgTable('_Req', {
	ProfileId: text('B').notNull()
}, (Req) => ({
	'_Req_Profile_fkey': foreignKey({
		name: '_Req_Profile_fkey',
		columns: [Req.ProfileId],
		foreignColumns: [Profile.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'_Req_Profile_fkey': foreignKey({
		name: '_Req_Profile_fkey',
		columns: [Req.ProfileId],
		foreignColumns: [Profile.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const FriendToFriend = pgTable('_FriendToFriend', {
	ProfileId: text('B').notNull()
}, (FriendToFriend) => ({
	'_FriendToFriend_Profile_fkey': foreignKey({
		name: '_FriendToFriend_Profile_fkey',
		columns: [FriendToFriend.ProfileId],
		foreignColumns: [Profile.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'_FriendToFriend_Profile_fkey': foreignKey({
		name: '_FriendToFriend_Profile_fkey',
		columns: [FriendToFriend.ProfileId],
		foreignColumns: [Profile.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const UserRelations = relations(User, ({ many }) => ({
	profile: many(Profile, {
		relationName: 'ProfileToUser'
	})
}));

export const ProfileRelations = relations(Profile, ({ one, many }) => ({
	user: one(User, {
		relationName: 'ProfileToUser',
		fields: [Profile.id],
		references: [User.id]
	}),
	incomingReq: many(ProfileToProfile, {
		relationName: 'ProfileToProfileToProfile'
	}),
	outgoingReq: many(ProfileToProfile, {
		relationName: 'ProfileToProfileToProfile'
	}),
	friends: many(ProfileToProfile, {
		relationName: 'ProfileToProfileToProfile'
	}),
	friendsOf: many(ProfileToProfile, {
		relationName: 'ProfileToProfileToProfile'
	})
}));

export const ReqRelations = relations(Req, ({ one }) => ({
	Profile: one(Profile, {
		relationName: 'ProfileToProfileToProfile',
		fields: [Req.ProfileId],
		references: [Profile.id]
	}),
	Profile: one(Profile, {
		relationName: 'ProfileToProfileToProfile',
		fields: [Req.ProfileId],
		references: [Profile.id]
	})
}));

export const FriendToFriendRelations = relations(FriendToFriend, ({ one }) => ({
	Profile: one(Profile, {
		relationName: 'ProfileToProfileToProfile',
		fields: [FriendToFriend.ProfileId],
		references: [Profile.id]
	}),
	Profile: one(Profile, {
		relationName: 'ProfileToProfileToProfile',
		fields: [FriendToFriend.ProfileId],
		references: [Profile.id]
	})
}));