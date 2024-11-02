/*
  Warnings:

  - A unique constraint covering the columns `[usernames]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "usernames" TEXT NOT NULL DEFAULT 'dummy_username';

-- CreateIndex
CREATE UNIQUE INDEX "User_usernames_key" ON "User"("usernames");
