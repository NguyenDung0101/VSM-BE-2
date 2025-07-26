/*
  Warnings:

  - You are about to drop the column `image` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[imageId]` on the table `events` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatarId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `events` DROP COLUMN `image`,
    ADD COLUMN `imageId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `avatar`,
    ADD COLUMN `avatarId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `images` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `eventId` VARCHAR(191) NULL,

    UNIQUE INDEX `images_userId_key`(`userId`),
    UNIQUE INDEX `images_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `events_imageId_key` ON `events`(`imageId`);

-- CreateIndex
CREATE UNIQUE INDEX `users_avatarId_key` ON `users`(`avatarId`);

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
