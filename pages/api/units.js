
import prisma from "@/lib/prisma"
import bcrypt from 'bcrypt'

const saltRounds = 10
const random_password_length = 12
const super_admin_page_name = "super-admin"

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
    const { id, unit, field_to_patch } = req.body

    if (req.method == "POST" || req.method == "PUT") {
        // Parameter Validation
        if (unit == super_admin_page_name) {
            return res.status(400).json({ message: "super-admin is an invalid unit name." })
        }
        if (unit == '') {
            return res.status(400).json({ message: "Unit name has not been provided" })
        }        
    }
    try {
        switch (req.method) {
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
                await prisma.Unit.create({
                    data: {
                        id: id,
                        name: unit,
                        password: hashed_password,
                        isRandomlyGeneratedPassword: true
                    }
                })
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