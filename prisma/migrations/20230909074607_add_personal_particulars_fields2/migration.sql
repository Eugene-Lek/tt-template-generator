-- CreateTable
CREATE TABLE "PersonalParticularsField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "unitName" TEXT NOT NULL,

    CONSTRAINT "PersonalParticularsField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalParticularsField_name_unitName_key" ON "PersonalParticularsField"("name", "unitName");

-- AddForeignKey
ALTER TABLE "PersonalParticularsField" ADD CONSTRAINT "PersonalParticularsField_unitName_fkey" FOREIGN KEY ("unitName") REFERENCES "Unit"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
