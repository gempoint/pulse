/*
  Warnings:

  - You are about to drop the column `artist` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pfp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `staff` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatType" AS ENUM ('View');

-- DropForeignKey
ALTER TABLE "_FriendToFriend" DROP CONSTRAINT "_FriendToFriend_A_fkey";

-- DropForeignKey
ALTER TABLE "_FriendToFriend" DROP CONSTRAINT "_FriendToFriend_B_fkey";

-- DropForeignKey
ALTER TABLE "_Req" DROP CONSTRAINT "_Req_A_fkey";

-- DropForeignKey
ALTER TABLE "_Req" DROP CONSTRAINT "_Req_B_fkey";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "artist",
DROP COLUMN "bio",
DROP COLUMN "color",
DROP COLUMN "name",
DROP COLUMN "pfp",
DROP COLUMN "staff",
DROP COLUMN "state",
DROP COLUMN "username",
DROP COLUMN "verified",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "extra" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Stat" (
    "type" "StatType" NOT NULL,
    "special" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("type","special")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "pfp" TEXT NOT NULL DEFAULT 'https://i.scdn.co/image/ab676161000051747baf6a3e4e70248079e48c5a',
    "name" TEXT NOT NULL DEFAULT 'dummy_text',
    "username" TEXT NOT NULL DEFAULT 'dummy_username',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "staff" BOOLEAN NOT NULL DEFAULT false,
    "artist" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT '#EB459E',
    "bio" TEXT NOT NULL DEFAULT 'im new to dis',
    "state" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_id_key" ON "Profile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Req" ADD CONSTRAINT "_Req_A_fkey" FOREIGN KEY ("A") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Req" ADD CONSTRAINT "_Req_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FriendToFriend" ADD CONSTRAINT "_FriendToFriend_A_fkey" FOREIGN KEY ("A") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FriendToFriend" ADD CONSTRAINT "_FriendToFriend_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
