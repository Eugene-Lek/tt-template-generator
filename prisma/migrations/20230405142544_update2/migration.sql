/*
  Warnings:

  - Added the required column `name` to the `Vocation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vocation" ADD COLUMN     "name" TEXT NOT NULL;
