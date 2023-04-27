/*
  Warnings:

  - A unique constraint covering the columns `[title,primaryappointmentId]` on the table `PrimaryAppointmentAchievement` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PrimaryAppointmentAchievement_title_key";

-- CreateIndex
CREATE UNIQUE INDEX "PrimaryAppointmentAchievement_title_primaryappointmentId_key" ON "PrimaryAppointmentAchievement"("title", "primaryappointmentId");
