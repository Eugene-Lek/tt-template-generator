/*
  Warnings:

  - Added the required column `template` to the `OtherContribution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template` to the `OtherIndividualAchievement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OtherContribution" ADD COLUMN     "template" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OtherIndividualAchievement" ADD COLUMN     "template" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VocationRankCombination" ADD COLUMN     "conclusionId" TEXT;

-- CreateTable
CREATE TABLE "Conclusion" (
    "id" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,

    CONSTRAINT "Conclusion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VocationRankCombination" ADD CONSTRAINT "VocationRankCombination_conclusionId_fkey" FOREIGN KEY ("conclusionId") REFERENCES "Conclusion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conclusion" ADD CONSTRAINT "Conclusion_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
