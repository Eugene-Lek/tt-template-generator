const { PrismaClient } = require('@prisma/client')

const DEFAULT_PERSONAL_PARTICULAR_FIELDS = [
    { name: "Full Name", type: "Text (ALL CAPS)" },
    { name: "Rank", type: "Text (ALL CAPS)" },
    { name: "First Name", type: "Text (ALL CAPS)" },
    { name: "Enlistment Date", type: "Date" },
    { name: "Company", type: "Text (Capitalised)" }
]

// This script adds the default personal particulars to all existing unit accounts
const prisma = new PrismaClient()
const runMigration = async () => {
    const allUnits = await prisma.Unit.findMany({
        include: {
            PersonalParticularsFields: true
        }
    })
    const unitsWithoutFields = allUnits.filter(unitObj => unitObj.PersonalParticularsFields.length == 0)

    await Promise.all(unitsWithoutFields.map(unitData => {
        return prisma.Unit.update({
            where: {
                id: unitData.id
            },
            data: {
                PersonalParticularsFields: {
                    createMany: {
                        data: DEFAULT_PERSONAL_PARTICULAR_FIELDS.map((field, index) => { field.order = index; return field })
                    }
                }
            }
        })
    }))
}

runMigration()

