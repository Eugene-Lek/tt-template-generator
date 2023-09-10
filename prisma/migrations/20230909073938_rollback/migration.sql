/*
  Warnings:

  - You are about to drop the `PersonalParticularsField` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PersonalParticularsField" DROP CONSTRAINT "PersonalParticularsField_unitName_fkey";

-- DropTable
DROP TABLE "PersonalParticularsField";
