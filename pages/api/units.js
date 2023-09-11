
import prisma from "@/lib/prisma"
import bcrypt from 'bcrypt'

const saltRounds = 10
const random_password_length = 12
const super_admin_page_name = "super-admin"
const DEFAULT_PERSONAL_PARTICULAR_FIELDS = [
    { name: "Full Name", type: "Text (ALL CAPS)" },
    { name: "Rank", type: "Text (ALL CAPS)" },
    { name: "First Name", type: "Text (ALL CAPS)" },
    { name: "Enlistment Date", type: "Date" },
    { name: "Company", type: "Text (Capitalised)" }
]

const genPassword = (passwordLength) => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var password = "";
    for (var i = 0; i <= passwordLength; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        password += chars.substring(randomNumber, randomNumber + 1);
    }
    return password
}


export default async function handler(req, res) {

    if (req.method != "GET") {
        var { id, unit, field_to_patch, selected_copy_unit } = req.body
    }

    if (req.method == "POST" || req.method == "PATCH") {
        // Parameter Validation
        if (unit == super_admin_page_name) {
            return res.status(400).json({ message: "super-admin is an invalid unit name." })
        }
        if (unit == '') {
            return res.status(400).json({ message: "Please provide a unit name" })
        }
        if (!unit.match(/^[0-9A-Z ]+$/)) {
            displayErrorMessage(`The unit name can only include alphabets, numbers, and spaces`)
            return
        }
    }
    try {
        switch (req.method) {
            case "GET":
                const units_data = await prisma.Unit.findMany({
                    include: {
                        PersonalParticularsFields: {
                            orderBy: {
                                order: 'asc',
                              },                            
                        },
                        Vocations: true,
                        Introductions: true,
                        PreUnitAchievements: true,
                        PrimaryAppointments: true,
                        SecondaryAppointments: true,
                        SoldierFundamentals: true,
                        OtherContributions: true,
                        OtherIndividualAchievements: true,
                        Conclusions: true
                    }
                })
                if (units_data.length == 0) {
                    var units_init_data = [
                        {
                            id: uuidv4(),
                            unit: "",
                            overview_data: {
                                PersonalParticularsFields: [],
                                Companies: [],
                                Vocations: [],
                                Introductions: [],
                                PreUnitAchievements: [],
                                PrimaryAppointments: [],
                                PrimaryAppointmentsAchievements: [],
                                SecondaryAppointments: [],
                                SoldierFundamentals: [],
                                OtherContributions: [],
                                OtherIndividualAchievements: [],
                                Conclusions: []
                            },
                            previously_saved_unit: "",
                            button_state: "save",
                            display: "block"
                        }
                    ]
                } else {
                    var units_init_data = units_data.map(unit => {
                        return {
                            id: unit.id,
                            unit: unit.name,
                            previously_saved_unit: unit.name,
                            overview_data: unit,
                            button_state: "edit",
                            display: "block"
                        }
                    }
                    )
                }
                return res.status(200).json({ units_init_data: units_init_data })
                break

            case "POST":
                // Generate a random password
                const random_password = genPassword(random_password_length)
                // A random salt is generated for every password hashing request
                const salt = await bcrypt.genSalt(saltRounds)
                // The salt is used to set the parameters of the hashing function
                // It will be attached to the hash in the final result so that way it can be 
                // used to initialise the hashing function that is used to hash the user's input password. 
                // This second hash is then compared to the stored hash, and if they are the same, 
                // the user is authenticated. 
                const hashed_password = await bcrypt.hash(random_password, salt)
                if (!selected_copy_unit) {
                    await prisma.Unit.create({
                        data: {
                            id: id,
                            name: unit,
                            password: hashed_password,
                            isRandomlyGeneratedPassword: true,
                            PersonalParticularsFields: {
                                createMany: {
                                    data: DEFAULT_PERSONAL_PARTICULAR_FIELDS.map((field, index) => { field.order = index; return field })
                                }
                            }
                        }
                    })
                } else {
                    // Get the data of the unit we wish to copy
                    const copy_unit_data = await prisma.Unit.findUnique({
                        where: {
                            name: selected_copy_unit
                        },
                        select: {
                            Companies: true,
                            PersonalParticularsFields: true,
                            Vocations: true,
                            VocationRankCombinations: true,
                            Introductions: {
                                include: {
                                    appliesto: {
                                        select: {
                                            vocation: true,
                                            rank: true
                                        }
                                    }
                                }
                            },
                            PreUnitAchievements: {
                                include: {
                                    appliesto: {
                                        select: {
                                            vocation: true,
                                            rank: true
                                        }
                                    }
                                }
                            },
                            PrimaryAppointments: {
                                include: {
                                    achievements: true,
                                    appliesto: {
                                        select: {
                                            vocation: true,
                                            rank: true
                                        }
                                    }
                                }
                            },
                            SecondaryAppointments: {
                                include: {
                                    appliesto: {
                                        select: {
                                            vocation: true,
                                            rank: true
                                        }
                                    }
                                }
                            },
                            SoldierFundamentals: {
                                include: {
                                    appliesto: {
                                        select: {
                                            vocation: true,
                                            rank: true
                                        }
                                    }
                                }
                            },
                            OtherContributions: {
                                include: {
                                    appliesto: {
                                        select: {
                                            vocation: true,
                                            rank: true
                                        }
                                    }
                                }
                            },
                            OtherIndividualAchievements: {
                                include: {
                                    appliesto: {
                                        select: {
                                            vocation: true,
                                            rank: true
                                        }
                                    }
                                }
                            },
                            Conclusions: {
                                include: {
                                    appliesto: {
                                        select: {
                                            vocation: true,
                                            rank: true
                                        }
                                    }
                                }
                            }
                        }
                    })
                    await prisma.Unit.create({
                        data: {
                            id: id,
                            name: unit,
                            password: hashed_password,
                            isRandomlyGeneratedPassword: true,
                            PersonalParticularsFields: {
                                create: copy_unit_data.PersonalParticularsFields.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    return obj
                                })                                
                            },
                            Vocations: {
                                create: copy_unit_data.Vocations.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    return obj
                                })
                            },
                            VocationRankCombinations: {
                                create: copy_unit_data.VocationRankCombinations.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    return obj
                                })
                            },
                            PreUnitAchievements: {
                                create: copy_unit_data.PreUnitAchievements.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    obj.appliesto = {
                                        connect: obj.appliesto.map(inner_obj => {
                                            inner_obj.unitName = unit
                                            return { vocation_rank_unitName: inner_obj }
                                        })
                                    }
                                    return obj
                                })
                            },
                            Introductions: {
                                create: copy_unit_data.Introductions.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    obj.appliesto = {
                                        connect: obj.appliesto.map(inner_obj => {
                                            inner_obj.unitName = unit
                                            return { vocation_rank_unitName: inner_obj }
                                        })
                                    }
                                    return obj
                                })
                            },
                            PrimaryAppointments: {
                                create: copy_unit_data.PrimaryAppointments.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    obj.appliesto = {
                                        connect: obj.appliesto.map(inner_obj => {
                                            inner_obj.unitName = unit
                                            return { vocation_rank_unitName: inner_obj }
                                        })
                                    }
                                    obj.achievements = {
                                        create: obj.achievements.map(inner_obj => {
                                            inner_obj.id = undefined
                                            inner_obj.unitName = undefined // Get rid of foreign key
                                            inner_obj.primaryappointmentId = undefined // Get rid of foreign 
                                            inner_obj.unit = {
                                                connect: { id: id }
                                            }
                                            return inner_obj
                                        })
                                    }
                                    return obj
                                })
                            },
                            SecondaryAppointments: {
                                create: copy_unit_data.SecondaryAppointments.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    obj.appliesto = {
                                        connect: obj.appliesto.map(inner_obj => {
                                            inner_obj.unitName = unit
                                            return { vocation_rank_unitName: inner_obj }
                                        })
                                    }
                                    return obj
                                })
                            },
                            SoldierFundamentals: {
                                create: copy_unit_data.SoldierFundamentals.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    obj.appliesto = {
                                        connect: obj.appliesto.map(inner_obj => {
                                            inner_obj.unitName = unit
                                            return { vocation_rank_unitName: inner_obj }
                                        })
                                    }
                                    return obj
                                })
                            },
                            OtherContributions: {
                                create: copy_unit_data.OtherContributions.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    obj.appliesto = {
                                        connect: obj.appliesto.map(inner_obj => {
                                            inner_obj.unitName = unit
                                            return { vocation_rank_unitName: inner_obj }
                                        })
                                    }
                                    return obj
                                })
                            },
                            OtherIndividualAchievements: {
                                create: copy_unit_data.OtherIndividualAchievements.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    obj.appliesto = {
                                        connect: obj.appliesto.map(inner_obj => {
                                            inner_obj.unitName = unit
                                            return { vocation_rank_unitName: inner_obj }
                                        })
                                    }
                                    return obj
                                })
                            },
                            Conclusions: {
                                create: copy_unit_data.Conclusions.map(obj => {
                                    obj.id = undefined // This way prisma will automatically assign a new id to the object
                                    obj.unitName = undefined // Get rid of foreign key
                                    obj.appliesto = {
                                        connect: obj.appliesto.map(inner_obj => {
                                            inner_obj.unitName = unit
                                            return { vocation_rank_unitName: inner_obj }
                                        })
                                    }
                                    return obj
                                })
                            }
                        }
                    })
                }
                // Create a unit account with this information
                return res.status(200).json({ random_password: random_password, message: "Unit Admin account successfully created." })
                break
            case "PATCH":
                if (field_to_patch == "unitName") {
                    await prisma.Unit.update({
                        where: {
                            id: id
                        },
                        data: {
                            name: unit,
                        }
                    })
                    return res.status(200).json({ message: "Unit Admin account name successfully updated." })
                } else if (field_to_patch == "password") {
                    // Generate a random password
                    const random_password = genPassword(random_password_length)
                    // A random salt is generated for every password hashing request
                    const salt = await bcrypt.genSalt(saltRounds)
                    // The salt is used to set the parameters of the hashing function
                    // It will be attached to the hash in the final result so that way it can be 
                    // used to initialise the hashing function that is used to hash the user's input password. 
                    // This second hash is then compared to the stored hash, and if they are the same, 
                    // the user is authenticated. 
                    const hashed_password = await bcrypt.hash(random_password, salt)
                    await prisma.Unit.update({
                        where: {
                            id: id
                        },
                        data: {
                            password: hashed_password,
                            isRandomlyGeneratedPassword: true
                        }
                    })
                    return res.status(200).json({ random_password: random_password, message: "Unit admin account password successfully updated." })
                }
                break
            case "DELETE":
                console.log("reached1")                
                await prisma.PersonalParticularsField.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                console.log("reached2")
                await prisma.Vocation.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.VocationRankCombination.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.PreUnitAchievement.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.Introduction.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.PrimaryAppointmentAchievement.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.PrimaryAppointment.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.SecondaryAppointment.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.SoldierFundamental.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.OtherContribution.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.OtherIndividualAchievement.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.Conclusion.deleteMany({
                    where: {
                        unitName: unit
                    }
                })
                await prisma.Unit.delete({
                    where: {
                        name: unit
                    }
                })
                res.status(200).json({ message: 'Delete Successful' })
            default:
                break
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.message })
    }
}