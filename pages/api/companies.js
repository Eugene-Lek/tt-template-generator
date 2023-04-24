import prisma from "lib/prisma"

export default async function handler(req, res) {

    var { unit, companies} = req.body

    // Parameter Validation   
    if (companies.length == 0 || companies.every(company => company == '')) {
        return res.status(400).json({ message: 'At least 1 company must be provided' })
    }

    try {
        switch (req.method) {
            case "PUT":
                // Create a new SoldierFundamental Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        Companies: companies
                    }
                })

                res.status(200).json({ message: 'Save Successful' })
                break

            default:
                break
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
