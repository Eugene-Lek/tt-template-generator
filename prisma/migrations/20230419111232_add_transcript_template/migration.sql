-- AlterTable
ALTER TABLE "Conclusion" ADD COLUMN     "transcripttemplate" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Introduction" ADD COLUMN     "transcripttemplate" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "OtherContribution" ADD COLUMN     "transcripttemplate" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "OtherIndividualAchievement" ADD COLUMN     "transcripttemplate" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "PrimaryAppointment" ADD COLUMN     "transcripttemplate" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "SecondaryAppointment" ADD COLUMN     "transcripttemplate" TEXT NOT NULL DEFAULT '';
