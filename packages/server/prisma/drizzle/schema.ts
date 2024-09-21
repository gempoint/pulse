import { relations } from 'drizzle-orm'
import { boolean, foreignKey, pgTable, text } from 'drizzle-orm/pg-core'

export const User = pgTable('User', {
	id: text('id').notNull().primaryKey(),
	verified: boolean('verified').notNull(),
	staff: boolean('staff').notNull(),
	artist: boolean('artist').notNull(),
	flags: text('flags').array().notNull(),
	access_token: text('access_token').notNull(),
	refresh_token: text('refresh_token').notNull(),
	token: text('token').notNull()
});

export const UserToUser = pgTable('_UserToUser', {
	UserId: text('B').notNull()
}, (UserToUser) => ({
	'_UserToUser_User_fkey': foreignKey({
		name: '_UserToUser_User_fkey',
		columns: [UserToUser.UserId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'_UserToUser_User_fkey': foreignKey({
		name: '_UserToUser_User_fkey',
		columns: [UserToUser.UserId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const UserRelations = relations(User, ({ many }) => ({
	following: many(UserToUser, {
		relationName: 'UserToUserToUser'
	}),
	followers: many(UserToUser, {
		relationName: 'UserToUserToUser'
	})
}));

export const UserToUserRelations = relations(UserToUser, ({ one }) => ({
	User: one(User, {
		relationName: 'UserToUserToUser',
		fields: [UserToUser.UserId],
		references: [User.id]
	}),
	User: one(User, {
		relationName: 'UserToUserToUser',
		fields: [UserToUser.UserId],
		references: [User.id]
	})
}));