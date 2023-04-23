/*
  Warnings:

  - The primary key for the `Unit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `id` on table `Unit` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_pkey",
ALTER COLUMN "id" SET NOT NULL,
ADD CONSTRAINT "Unit_pkey" PRIMARY KEY ("id");
