/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `ReceivingInspection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReceivingInspection" DROP COLUMN "photoUrl",
ADD COLUMN     "photoFormUrl" TEXT,
ADD COLUMN     "photoMaterialUrl" TEXT;
