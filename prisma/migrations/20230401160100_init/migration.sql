-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankVocationCombination" (
    "id" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "vocation" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "introductionId" TEXT,
    "primaryappointmentId" TEXT,

    CONSTRAINT "RankVocationCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreUnitAchievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "conjunction" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "PreUnitAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Introduction" (
    "id" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "Introduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrimaryAppointment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "conjunction" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "PrimaryAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrimaryAppointmentAchievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "conjunction" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "primaryappointmentId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "PrimaryAppointmentAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecondaryAppointment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "conjunction" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "SecondaryAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoldierFundamental" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "laymanterm" TEXT NOT NULL,
    "awards" TEXT[],
    "unitId" TEXT NOT NULL,

    CONSTRAINT "SoldierFundamental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherContribution" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "OtherContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherIndividualAchievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "OtherIndividualAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RankVocationCombinationToSecondaryAppointment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_RankVocationCombinationToSoldierFundamental" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PreUnitAchievementToRankVocationCombination" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_RankVocationCombinationToSecondaryAppointment_AB_unique" ON "_RankVocationCombinationToSecondaryAppointment"("A", "B");

-- CreateIndex
CREATE INDEX "_RankVocationCombinationToSecondaryAppointment_B_index" ON "_RankVocationCombinationToSecondaryAppointment"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RankVocationCombinationToSoldierFundamental_AB_unique" ON "_RankVocationCombinationToSoldierFundamental"("A", "B");

-- CreateIndex
CREATE INDEX "_RankVocationCombinationToSoldierFundamental_B_index" ON "_RankVocationCombinationToSoldierFundamental"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PreUnitAchievementToRankVocationCombination_AB_unique" ON "_PreUnitAchievementToRankVocationCombination"("A", "B");

-- CreateIndex
CREATE INDEX "_PreUnitAchievementToRankVocationCombination_B_index" ON "_PreUnitAchievementToRankVocationCombination"("B");

-- AddForeignKey
ALTER TABLE "RankVocationCombination" ADD CONSTRAINT "RankVocationCombination_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankVocationCombination" ADD CONSTRAINT "RankVocationCombination_introductionId_fkey" FOREIGN KEY ("introductionId") REFERENCES "Introduction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankVocationCombination" ADD CONSTRAINT "RankVocationCombination_primaryappointmentId_fkey" FOREIGN KEY ("primaryappointmentId") REFERENCES "PrimaryAppointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreUnitAchievement" ADD CONSTRAINT "PreUnitAchievement_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrimaryAppointment" ADD CONSTRAINT "PrimaryAppointment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrimaryAppointmentAchievement" ADD CONSTRAINT "PrimaryAppointmentAchievement_primaryappointmentId_fkey" FOREIGN KEY ("primaryappointmentId") REFERENCES "PrimaryAppointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrimaryAppointmentAchievement" ADD CONSTRAINT "PrimaryAppointmentAchievement_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondaryAppointment" ADD CONSTRAINT "SecondaryAppointment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoldierFundamental" ADD CONSTRAINT "SoldierFundamental_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherContribution" ADD CONSTRAINT "OtherContribution_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherIndividualAchievement" ADD CONSTRAINT "OtherIndividualAchievement_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RankVocationCombinationToSecondaryAppointment" ADD CONSTRAINT "_RankVocationCombinationToSecondaryAppointment_A_fkey" FOREIGN KEY ("A") REFERENCES "RankVocationCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RankVocationCombinationToSecondaryAppointment" ADD CONSTRAINT "_RankVocationCombinationToSecondaryAppointment_B_fkey" FOREIGN KEY ("B") REFERENCES "SecondaryAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RankVocationCombinationToSoldierFundamental" ADD CONSTRAINT "_RankVocationCombinationToSoldierFundamental_A_fkey" FOREIGN KEY ("A") REFERENCES "RankVocationCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RankVocationCombinationToSoldierFundamental" ADD CONSTRAINT "_RankVocationCombinationToSoldierFundamental_B_fkey" FOREIGN KEY ("B") REFERENCES "SoldierFundamental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreUnitAchievementToRankVocationCombination" ADD CONSTRAINT "_PreUnitAchievementToRankVocationCombination_A_fkey" FOREIGN KEY ("A") REFERENCES "PreUnitAchievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreUnitAchievementToRankVocationCombination" ADD CONSTRAINT "_PreUnitAchievementToRankVocationCombination_B_fkey" FOREIGN KEY ("B") REFERENCES "RankVocationCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
