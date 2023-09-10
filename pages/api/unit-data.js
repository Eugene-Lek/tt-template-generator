import prisma from "lib/prisma"

export default async function handler(req, res) {
    if (!req.query.unit){
        return res.status(400).json({message: "You have not selected a unit"})
    }
    try {
        switch (req.method) {
            case "GET":
                const unit_data_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        Companies: true, 
                        Vocations: true,                        
                        PersonalParticularsFields: {
                            orderBy: {
                                order: 'asc',
                              },                            
                        },
                        PreUnitAchievements: {
                            include: {
                                appliesto: true
                            }
                        },                     
                        PrimaryAppointments: {
                            include: {
                                achievements: true,
                                appliesto: true
                            }
                        },           
                        SecondaryAppointments: {
                            include: {
                                appliesto: true
                            }                            
                        },          
                        SoldierFundamentals: {
                            include: {
                                appliesto: true
                            }                            
                        },            
                        OtherContributions: {
                            include: {
                                appliesto: true
                            }                            
                        },            
                        OtherIndividualAchievements: {
                            include: {
                                appliesto: true
                            }
                        }
                    }
                })
                res.status(200).json({ unit_data_dict, message: "Unit Data Successfully Retrieved" })
                break

            default:
                break
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
