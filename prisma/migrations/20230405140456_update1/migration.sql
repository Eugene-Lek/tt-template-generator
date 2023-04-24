/*
  Warnings:

  - You are about to drop the column `unitId` on the `Introduction` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `OtherContribution` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `OtherIndividualAchievement` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `PreUnitAchievement` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `PrimaryAppointment` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `PrimaryAppointmentAchievement` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `SecondaryAppointment` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `SoldierFundamental` table. All the data in the column will be lost.
  - The primary key for the `Unit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the `RankVocationCombination` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PreUnitAchievementToRankVocationCombination` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RankVocationCombinationToSecondaryAppointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RankVocationCombinationToSoldierFundamental` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `unitName` to the `Introduction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitName` to the `OtherContribution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitName` to the `OtherIndividualAchievement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitName` to the `PreUnitAchievement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitName` to the `PrimaryAppointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitName` to the `PrimaryAppointmentAchievement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitName` to the `SecondaryAppointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitName` to the `SoldierFundamental` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Introduction" DROP CONSTRAINT "Introduction_unitId_fkey";

-- DropForeignKey
ALTER TABLE "OtherContribution" DROP CONSTRAINT "OtherContribution_unitId_fkey";

-- DropForeignKey
ALTER TABLE "OtherIndividualAchievement" DROP CONSTRAINT "OtherIndividualAchievement_unitId_fkey";

-- DropForeignKey
ALTER TABLE "PreUnitAchievement" DROP CONSTRAINT "PreUnitAchievement_unitId_fkey";

-- DropForeignKey
ALTER TABLE "PrimaryAppointment" DROP CONSTRAINT "PrimaryAppointment_unitId_fkey";

-- DropForeignKey
ALTER TABLE "PrimaryAppointmentAchievement" DROP CONSTRAINT "PrimaryAppointmentAchievement_unitId_fkey";

-- DropForeignKey
ALTER TABLE "RankVocationCombination" DROP CONSTRAINT "RankVocationCombination_introductionId_fkey";

-- DropForeignKey
ALTER TABLE "RankVocationCombination" DROP CONSTRAINT "RankVocationCombination_primaryappointmentId_fkey";

-- DropForeignKey
ALTER TABLE "RankVocationCombination" DROP CONSTRAINT "RankVocationCombination_unitId_fkey";

-- DropForeignKey
ALTER TABLE "SecondaryAppointment" DROP CONSTRAINT "SecondaryAppointment_unitId_fkey";

-- DropForeignKey
ALTER TABLE "SoldierFundamental" DROP CONSTRAINT "SoldierFundamental_unitId_fkey";

-- DropForeignKey
ALTER TABLE "_PreUnitAchievementToRankVocationCombination" DROP CONSTRAINT "_PreUnitAchievementToRankVocationCombination_A_fkey";

-- DropForeignKey
ALTER TABLE "_PreUnitAchievementToRankVocationCombination" DROP CONSTRAINT "_PreUnitAchievementToRankVocationCombination_B_fkey";

-- DropForeignKey
ALTER TABLE "_RankVocationCombinationToSecondaryAppointment" DROP CONSTRAINT "_RankVocationCombinationToSecondaryAppointment_A_fkey";

-- DropForeignKey
ALTER TABLE "_RankVocationCombinationToSecondaryAppointment" DROP CONSTRAINT "_RankVocationCombinationToSecondaryAppointment_B_fkey";

-- DropForeignKey
ALTER TABLE "_RankVocationCombinationToSoldierFundamental" DROP CONSTRAINT "_RankVocationCombinationToSoldierFundamental_A_fkey";

-- DropForeignKey
ALTER TABLE "_RankVocationCombinationToSoldierFundamental" DROP CONSTRAINT "_RankVocationCombinationToSoldierFundamental_B_fkey";

-- AlterTable
ALTER TABLE "Introduction" DROP COLUMN "unitId",
ADD COLUMN     "unitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OtherContribution" DROP COLUMN "unitId",
ADD COLUMN     "unitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OtherIndividualAchievement" DROP COLUMN "unitId",
ADD COLUMN     "unitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PreUnitAchievement" DROP COLUMN "unitId",
ADD COLUMN     "unitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PrimaryAppointment" DROP COLUMN "unitId",
ADD COLUMN     "unitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PrimaryAppointmentAchievement" DROP COLUMN "unitId",
ADD COLUMN     "unitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SecondaryAppointment" DROP COLUMN "unitId",
ADD COLUMN     "unitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SoldierFundamental" DROP COLUMN "unitId",
ADD COLUMN     "unitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Unit_pkey" PRIMARY KEY ("name");

-- DropTable
DROP TABLE "RankVocationCombination";

-- DropTable
DROP TABLE "_PreUnitAchievementToRankVocationCombination";

-- DropTable
DROP TABLE "_RankVocationCombinationToSecondaryAppointment";

-- DropTable
DROP TABLE "_RankVocationCombinationToSoldierFundamental";

-- CreateTable
CREATE TABLE "Vocation" (
    "id" TEXT NOT NULL,
    "ranks" TEXT[],
    "unitName" TEXT NOT NULL,

    CONSTRAINT "Vocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocationRankCombination" (
    "id" TEXT NOT NULL,
    "vocation" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "introductionId" TEXT,
    "primaryappointmentId" TEXT,

    CONSTRAINT "VocationRankCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PreUnitAchievementToVocationRankCombination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SecondaryAppointmentToVocationRankCombination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SoldierFundamentalToVocationRankCombination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OtherContributionToVocationRankCombination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OtherIndividualAchievementToVocationRankCombination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VocationRankCombination_vocation_rank_key" ON "VocationRankCombination"("vocation", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "_PreUnitAchievementToVocationRankCombination_AB_unique" ON "_PreUnitAchievementToVocationRankCombination"("A", "B");

-- CreateIndex
CREATE INDEX "_PreUnitAchievementToVocationRankCombination_B_index" ON "_PreUnitAchievementToVocationRankCombination"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SecondaryAppointmentToVocationRankCombination_AB_unique" ON "_SecondaryAppointmentToVocationRankCombination"("A", "B");

-- CreateIndex
CREATE INDEX "_SecondaryAppointmentToVocationRankCombination_B_index" ON "_SecondaryAppointmentToVocationRankCombination"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SoldierFundamentalToVocationRankCombination_AB_unique" ON "_SoldierFundamentalToVocationRankCombination"("A", "B");

-- CreateIndex
CREATE INDEX "_SoldierFundamentalToVocationRankCombination_B_index" ON "_SoldierFundamentalToVocationRankCombination"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OtherContributionToVocationRankCombination_AB_unique" ON "_OtherContributionToVocationRankCombination"("A", "B");

-- CreateIndex
CREATE INDEX "_OtherContributionToVocationRankCombination_B_index" ON "_OtherContributionToVocationRankCombination"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OtherIndividualAchievementToVocationRankCombination_AB_unique" ON "_OtherIndividualAchievementToVocationRankCombination"("A", "B");

-- CreateIndex
CREATE INDEX "_OtherIndividualAchievementToVocationRankCombination_B_index" ON "_OtherIndividualAchievementToVocationRankCombination"("B");

-- AddForeignKey
ALTER TABLE "Vocation" ADD CONSTRAINT "Vocation_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocationRankCombination" ADD CONSTRAINT "VocationRankCombination_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocationRankCombination" ADD CONSTRAINT "VocationRankCombination_introductionId_fkey" FOREIGN KEY ("introductionId") REFERENCES "Introduction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocationRankCombination" ADD CONSTRAINT "VocationRankCombination_primaryappointmentId_fkey" FOREIGN KEY ("primaryappointmentId") REFERENCES "PrimaryAppointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreUnitAchievement" ADD CONSTRAINT "PreUnitAchievement_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrimaryAppointment" ADD CONSTRAINT "PrimaryAppointment_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrimaryAppointmentAchievement" ADD CONSTRAINT "PrimaryAppointmentAchievement_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryAppointment" ADD CONSTRAINT "SecondaryAppointment_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoldierFundamental" ADD CONSTRAINT "SoldierFundamental_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherContribution" ADD CONSTRAINT "OtherContribution_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherIndividualAchievement" ADD CONSTRAINT "OtherIndividualAchievement_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreUnitAchievementToVocationRankCombination" ADD CONSTRAINT "_PreUnitAchievementToVocationRankCombination_A_fkey" FOREIGN KEY ("A") REFERENCES "PreUnitAchievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreUnitAchievementToVocationRankCombination" ADD CONSTRAINT "_PreUnitAchievementToVocationRankCombination_B_fkey" FOREIGN KEY ("B") REFERENCES "VocationRankCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecondaryAppointmentToVocationRankCombination" ADD CONSTRAINT "_SecondaryAppointmentToVocationRankCombination_A_fkey" FOREIGN KEY ("A") REFERENCES "SecondaryAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecondaryAppointmentToVocationRankCombination" ADD CONSTRAINT "_SecondaryAppointmentToVocationRankCombination_B_fkey" FOREIGN KEY ("B") REFERENCES "VocationRankCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SoldierFundamentalToVocationRankCombination" ADD CONSTRAINT "_SoldierFundamentalToVocationRankCombination_A_fkey" FOREIGN KEY ("A") REFERENCES "SoldierFundamental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SoldierFundamentalToVocationRankCombination" ADD CONSTRAINT "_SoldierFundamentalToVocationRankCombination_B_fkey" FOREIGN KEY ("B") REFERENCES "VocationRankCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OtherContributionToVocationRankCombination" ADD CONSTRAINT "_OtherContributionToVocationRankCombination_A_fkey" FOREIGN KEY ("A") REFERENCES "OtherContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OtherContributionToVocationRankCombination" ADD CONSTRAINT "_OtherContributionToVocationRankCombination_B_fkey" FOREIGN KEY ("B") REFERENCES "VocationRankCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OtherIndividualAchievementToVocationRankCombination" ADD CONSTRAINT "_OtherIndividualAchievementToVocationRankCombination_A_fkey" FOREIGN KEY ("A") REFERENCES "OtherIndividualAchievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OtherIndividualAchievementToVocationRankCombination" ADD CONSTRAINT "_OtherIndividualAchievementToVocationRankCombination_B_fkey" FOREIGN KEY ("B") REFERENCES "VocationRankCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
