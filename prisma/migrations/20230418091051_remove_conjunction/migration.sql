/*
  Warnings:

  - You are about to drop the column `conjunction` on the `PrimaryAppointment` table. All the data in the column will be lost.
  - You are about to drop the column `conjunction` on the `PrimaryAppointmentAchievement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrimaryAppointment" DROP COLUMN "conjunction";

-- AlterTable
ALTER TABLE "PrimaryAppointmentAchievement" DROP COLUMN "conjunction";
