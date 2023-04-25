/*
  Warnings:

  - Made the column `isRandomlyGeneratedPassword` on table `Unit` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Unit" ALTER COLUMN "isRandomlyGeneratedPassword" SET NOT NULL;
