-- AlterTable
ALTER TABLE "VocationRankCombination" ADD COLUMN     "preUnitAchievementId" TEXT;

-- AddForeignKey
ALTER TABLE "VocationRankCombination" ADD CONSTRAINT "VocationRankCombination_preUnitAchievementId_fkey" FOREIGN KEY ("preUnitAchievementId") REFERENCES "PreUnitAchievement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
