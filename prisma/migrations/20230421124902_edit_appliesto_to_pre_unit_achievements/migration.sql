/*
  Warnings:

  - You are about to drop the column `preUnitAchievementId` on the `VocationRankCombination` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "VocationRankCombination" DROP CONSTRAINT "VocationRankCombination_preUnitAchievementId_fkey";

-- AlterTable
ALTER TABLE "VocationRankCombination" DROP COLUMN "preUnitAchievementId";

-- CreateTable
CREATE TABLE "_PreUnitAchievementToVocationRankCombination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PreUnitAchievementToVocationRankCombination_AB_unique" ON "_PreUnitAchievementToVocationRankCombination"("A", "B");

-- CreateIndex
CREATE INDEX "_PreUnitAchievementToVocationRankCombination_B_index" ON "_PreUnitAchievementToVocationRankCombination"("B");

-- AddForeignKey
ALTER TABLE "_PreUnitAchievementToVocationRankCombination" ADD CONSTRAINT "_PreUnitAchievementToVocationRankCombination_A_fkey" FOREIGN KEY ("A") REFERENCES "PreUnitAchievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreUnitAchievementToVocationRankCombination" ADD CONSTRAINT "_PreUnitAchievementToVocationRankCombination_B_fkey" FOREIGN KEY ("B") REFERENCES "VocationRankCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
