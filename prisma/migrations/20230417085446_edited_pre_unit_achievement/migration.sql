/*
  Warnings:

  - You are about to drop the column `conjunction` on the `PreUnitAchievement` table. All the data in the column will be lost.
  - You are about to drop the `_PreUnitAchievementToVocationRankCombination` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PreUnitAchievementToVocationRankCombination" DROP CONSTRAINT "_PreUnitAchievementToVocationRankCombination_A_fkey";

-- DropForeignKey
ALTER TABLE "_PreUnitAchievementToVocationRankCombination" DROP CONSTRAINT "_PreUnitAchievementToVocationRankCombination_B_fkey";

-- AlterTable
ALTER TABLE "PreUnitAchievement" DROP COLUMN "conjunction";

-- DropTable
DROP TABLE "_PreUnitAchievementToVocationRankCombination";
