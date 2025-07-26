/*
  Warnings:

  - You are about to drop the column `eventId` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `images` table. All the data in the column will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `images` DROP FOREIGN KEY `images_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `images` DROP FOREIGN KEY `images_userId_fkey`;

-- DropIndex
DROP INDEX `images_eventId_key` ON `images`;

-- DropIndex
DROP INDEX `images_userId_key` ON `images`;

-- AlterTable
ALTER TABLE `images` DROP COLUMN `eventId`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `userId`,
    MODIFY `type` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `events`;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_avatarId_fkey` FOREIGN KEY (`avatarId`) REFERENCES `images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
