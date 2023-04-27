/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `PreUnitAchievement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `PrimaryAppointmentAchievement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PreUnitAchievement_title_key" ON "PreUnitAchievement"("title");

-- CreateIndex
CREATE UNIQUE INDEX "PrimaryAppointmentAchievement_title_key" ON "PrimaryAppointmentAchievement"("title");
