/*
  Warnings:

  - A unique constraint covering the columns `[name,unitName]` on the table `Vocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vocation,rank,unitName]` on the table `VocationRankCombination` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Vocation_name_key";

-- DropIndex
DROP INDEX "VocationRankCombination_vocation_rank_key";

-- CreateIndex
CREATE UNIQUE INDEX "Vocation_name_unitName_key" ON "Vocation"("name", "unitName");

-- CreateIndex
CREATE UNIQUE INDEX "VocationRankCombination_vocation_rank_unitName_key" ON "VocationRankCombination"("vocation", "rank", "unitName");
