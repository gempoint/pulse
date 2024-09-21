-- AlterTable
ALTER TABLE "User" ADD COLUMN     "artist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flags" TEXT[],
ADD COLUMN     "staff" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "verified" SET DEFAULT false;
