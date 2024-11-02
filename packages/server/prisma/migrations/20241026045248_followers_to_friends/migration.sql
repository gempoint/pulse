/*
  Warnings:

  - You are about to drop the `_UserToUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_UserToUser" DROP CONSTRAINT "_UserToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserToUser" DROP CONSTRAINT "_UserToUser_B_fkey";

-- DropTable
DROP TABLE "_UserToUser";

-- CreateTable
CREATE TABLE "_FriendToFriend" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Req" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FriendToFriend_AB_unique" ON "_FriendToFriend"("A", "B");

-- CreateIndex
CREATE INDEX "_FriendToFriend_B_index" ON "_FriendToFriend"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Req_AB_unique" ON "_Req"("A", "B");

-- CreateIndex
CREATE INDEX "_Req_B_index" ON "_Req"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- AddForeignKey
ALTER TABLE "_FriendToFriend" ADD CONSTRAINT "_FriendToFriend_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FriendToFriend" ADD CONSTRAINT "_FriendToFriend_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Req" ADD CONSTRAINT "_Req_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Req" ADD CONSTRAINT "_Req_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
