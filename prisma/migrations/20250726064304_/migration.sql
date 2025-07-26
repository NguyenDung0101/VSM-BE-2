/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `images` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId]` on the table `images` will be added. If there are existing duplicate values, this will fail.
  - Made the column `type` on table `images` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_avatarId_fkey`;

-- AlterTable
ALTER TABLE `images` ADD COLUMN `eventId` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `type` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `imageEvent` VARCHAR(191) NULL,
    `maxParticipants` INTEGER NOT NULL,
    `currentParticipants` INTEGER NOT NULL DEFAULT 0,
    `category` ENUM('MARATHON', 'HALF_MARATHON', 'FIVE_K', 'TEN_K', 'FUN_RUN', 'TRAIL_RUN', 'NIGHT_RUN') NOT NULL,
    `status` ENUM('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    `distance` VARCHAR(191) NULL,
    `registrationFee` INTEGER NULL DEFAULT 0,
    `requirements` TEXT NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `registrationDeadline` DATETIME(3) NULL,
    `organizer` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `imageId` VARCHAR(191) NULL,

    UNIQUE INDEX `events_imageId_key`(`imageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `images_userId_key` ON `images`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `images_eventId_key` ON `images`(`eventId`);

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
