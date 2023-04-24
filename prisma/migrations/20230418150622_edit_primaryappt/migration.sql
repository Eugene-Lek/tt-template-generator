/*
  Warnings:

  - You are about to drop the column `primaryappointmentId` on the `VocationRankCombination` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "VocationRankCombination" DROP CONSTRAINT "VocationRankCombination_primaryappointmentId_fkey";

-- AlterTable
ALTER TABLE "VocationRankCombination" DROP COLUMN "primaryappointmentId";

-- CreateTable
CREATE TABLE "_PrimaryAppointmentToVocationRankCombination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PrimaryAppointmentToVocationRankCombination_AB_unique" ON "_PrimaryAppointmentToVocationRankCombination"("A", "B");

-- CreateIndex
CREATE INDEX "_PrimaryAppointmentToVocationRankCombination_B_index" ON "_PrimaryAppointmentToVocationRankCombination"("B");

-- AddForeignKey
ALTER TABLE "_PrimaryAppointmentToVocationRankCombination" ADD CONSTRAINT "_PrimaryAppointmentToVocationRankCombination_A_fkey" FOREIGN KEY ("A") REFERENCES "PrimaryAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PrimaryAppointmentToVocationRankCombination" ADD CONSTRAINT "_PrimaryAppointmentToVocationRankCombination_B_fkey" FOREIGN KEY ("B") REFERENCES "VocationRankCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
