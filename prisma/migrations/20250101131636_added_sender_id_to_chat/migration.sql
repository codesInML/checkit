/*
  Warnings:

  - Added the required column `sender_id` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `sender_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
