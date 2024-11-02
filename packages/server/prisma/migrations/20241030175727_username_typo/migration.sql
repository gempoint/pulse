/*
  Warnings:

  - You are about to drop the column `usernames` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_usernames_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "usernames",
ADD COLUMN     "username" TEXT NOT NULL DEFAULT 'dummy_username';

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
