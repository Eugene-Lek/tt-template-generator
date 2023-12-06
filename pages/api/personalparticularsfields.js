import prisma from "lib/prisma"
import { authenticate, tokenExpiredMessage } from "@/src/authentication";

export default async function handler(req, res) {

    if (req.method != "GET" && req.method != "HEAD") {
        var { unit, personalParticularsField, previouslySavedName, remainingFields } = req.body
        var { name, type, id, order } = personalParticularsField
    } else {
        var { unit } = req.query
    }

    var cookie = req.cookies["AdminAuth"]

    let authenticated = authenticate(unit, cookie)
    if (!authenticated) {
        return res.status(401).json({ message: tokenExpiredMessage });
    }

    // Parameter Validation   
    if (req.method != "DELETE" && personalParticularsField?.name == "") {
        return res.status(400).json({ message: 'The name of the personal particular field cannot be blank' })
    }

    if (req.method == "POST" || req.method == "PUT") {
        const response = await prisma.PersonalParticularsField.findMany({
            where: {
                unitName: unit
            }, orderBy: {
                order: 'asc',
            },
        })
        const existingPersonalParticulars = response.filter(obj => obj.id != id).map(obj => obj.name.toLowerCase())
        if (existingPersonalParticulars.includes(name.toLowerCase())) return res.status(400).json({ message: `"${name}" already exists` })
    }

    try {
        switch (req.method) {
            case "DELETE":
                // Delete the PreUnitAchievement object if it exists
                const PersonalParticularsField_exists = await prisma.PersonalParticularsField.findUnique({
                    where: {
                        id: id
                    }
                })

                if (!PersonalParticularsField_exists) return res.status(200).json({ message: 'Delete Successful' })

                const templates_raw = await prisma.Unit.findUnique({
                    where: {
                        name: unit
                    },
                    select: {
                        Introductions: true,
                        PreUnitAchievements: true,
                        PrimaryAppointments: true,
                        PrimaryAppointmentAchievements: true,
                        SecondaryAppointments: true,
                        OtherContributions: true,
                        OtherIndividualAchievements: true,
                        Conclusions: true
                    }
                })

                const allTemplates = [
                    ...templates_raw.Introductions.map(obj => { obj["template type"] = "Introduction"; return obj }),
                    ...templates_raw.PreUnitAchievements.map(obj => { obj["template type"] = "Pre Unit Achievement"; return obj }),
                    ...templates_raw.PrimaryAppointments.map(obj => { obj["template type"] = "Primary Appointment"; return obj }),
                    ...templates_raw.PrimaryAppointmentAchievements.map(obj => { obj["template type"] = "Primary Appointment Achievement"; return obj }),
                    ...templates_raw.SecondaryAppointments.map(obj => { obj["template type"] = "Secondary Appointment"; return obj }),
                    ...templates_raw.OtherContributions.map(obj => { obj["template type"] = "Other Contributions"; return obj }),
                    ...templates_raw.OtherIndividualAchievements.map(obj => { obj["template type"] = "Other Individual Achievements"; return obj }),
                    ...templates_raw.Conclusions.map(obj => { obj["template type"] = "Conclusion"; return obj }),
                ]

                // Block the deletion if the field name has been inserted into any template
                for (let i = 0; i < allTemplates.length; i++) {
                    const withoutTranscript = allTemplates[i]["template type"] == "Primary Appointment Achievement" || allTemplates[i]["template type"] == "Pre Unit Achievement"

                    const inserted_placeholders_transcript = withoutTranscript ? [] : [...allTemplates[i]['transcripttemplate'].matchAll(/\{[^}]+\}/g)].map(obj => obj[0].slice(1, -1).toLowerCase()) // global search                                        
                    const inserted_placeholders_testimonial = [...allTemplates[i]['template'].matchAll(/\{[^}]+\}/g)] // global search 
                        .map(obj => obj[0].slice(1, -1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
                    if (inserted_placeholders_testimonial.includes(name.toLowerCase())) {
                        return res.status(400).json({
                            message: `*'${name}' cannot be deleted as it is used in the below ${allTemplates[i]['template type']} template.*
                                                        
                                                        "${allTemplates[i]['template']}"

                                                        *If you want to delete '${name}', you must remove it from the above ${allTemplates[i]['template type']} template first.*
                                                        *(Remember to click 'Save')*`
                        })
                    }
                    if (inserted_placeholders_transcript.includes(name.toLowerCase())) {
                        return res.status(400).json({
                            message: `*'${name}' cannot be deleted as it is used in the below ${allTemplates[i]['template type']} template.*
                                                        
                                                        "${allTemplates[i]['transcripttemplate']}"

                                                        *If you want to delete '${name}', you must remove it from the above ${allTemplates[i]['template type']} template first.*
                                                        *(Remember to click 'Save')*`
                        })
                    }
                }

                await prisma.PersonalParticularsField.delete({
                    where: {
                        id: id
                    }
                })

                remainingFields.forEach((field, index) => {field.order = index})

                // update the orders of the remaining fields
                await Promise.all([
                    ...remainingFields.map(data => {
                        return prisma.PersonalParticularsField.update({
                            where: {
                                id: data.id
                            },
                            data: data
                        })
                    })
                ])

                res.status(200).json({ message: 'Delete Successful' })
                break

            case "GET":
                const { unitName, fieldName } = req.query
                const templates = await prisma.Unit.findUnique({
                    where: {
                        name: unitName
                    },
                    select: {
                        Introductions: true,
                        PreUnitAchievements: true,
                        PrimaryAppointments: true,
                        PrimaryAppointmentAchievements: true,
                        SecondaryAppointments: true,
                        OtherContributions: true,
                        OtherIndividualAchievements: true,
                        Conclusions: true
                    }
                })
                const allTemplatesArray = [
                    ...templates.Introductions.map(obj => { obj["template type"] = "Introduction"; return obj }),
                    ...templates.PreUnitAchievements.map(obj => { obj["template type"] = "Pre Unit Achievement"; return obj }),
                    ...templates.PrimaryAppointments.map(obj => { obj["template type"] = "Primary Appointment"; return obj }),
                    ...templates.PrimaryAppointmentAchievements.map(obj => { obj["template type"] = "Primary Appointment Achievement"; return obj }),
                    ...templates.SecondaryAppointments.map(obj => { obj["template type"] = "Secondary Appointment"; return obj }),
                    ...templates.OtherContributions.map(obj => { obj["template type"] = "Other Contributions"; return obj }),
                    ...templates.OtherIndividualAchievements.map(obj => { obj["template type"] = "Other Individual Achievements"; return obj }),
                    ...templates.Conclusions.map(obj => { obj["template type"] = "Conclusion"; return obj }),
                ]

                for (let i = 0; i < allTemplatesArray.length; i++) {
                    const withoutTranscript = allTemplatesArray[i]["template type"] == "Primary Appointment Achievement" || allTemplatesArray[i]["template type"] == "Pre Unit Achievement"

                    const inserted_placeholders_transcript = withoutTranscript ? [] : [...allTemplatesArray[i]['transcripttemplate'].matchAll(/\{[^}]+\}/g)].map(obj => obj[0].slice(1, -1).toLowerCase()) // global search                                        
                    const inserted_placeholders_testimonial = [...allTemplatesArray[i]['template'].matchAll(/\{[^}]+\}/g)] // global search 
                        .map(obj => obj[0].slice(1, -1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
                    if (inserted_placeholders_testimonial.includes(fieldName.toLowerCase()) || inserted_placeholders_transcript.includes(fieldName.toLowerCase())) {
                        return res.status(200).json({ fieldIsUsed: true })
                    }
                }
                res.status(200).json({ fieldIsUsed: false })
                break

            case "PUT":
                await prisma.PersonalParticularsField.update({
                    where: {
                        id: id
                    },
                    data: personalParticularsField
                })

                if (previouslySavedName.toLowerCase() == name.toLowerCase()) return res.status(200).json({ message: 'Save Successful' })

                var regex = new RegExp(`{${previouslySavedName}}`, 'gi') // Case insensitive replacement
                const rawTemplates = await prisma.Unit.findUnique({
                    where: {
                        name: unit
                    },
                    select: {
                        Introductions: true,
                        PreUnitAchievements: true,
                        PrimaryAppointments: true,
                        PrimaryAppointmentAchievements: true,
                        SecondaryAppointments: true,
                        OtherContributions: true,
                        OtherIndividualAchievements: true,
                        Conclusions: true
                    }
                })

                const all_templates = [
                    ...rawTemplates.Introductions.map(obj => { obj["template type"] = "Introduction"; return obj }),
                    ...rawTemplates.PreUnitAchievements.map(obj => { obj["template type"] = "PreUnitAchievement"; return obj }),
                    ...rawTemplates.PrimaryAppointments.map(obj => { obj["template type"] = "PrimaryAppointment"; return obj }),
                    ...rawTemplates.PrimaryAppointmentAchievements.map(obj => { obj["template type"] = "PrimaryAppointmentAchievement"; return obj }),
                    ...rawTemplates.SecondaryAppointments.map(obj => { obj["template type"] = "SecondaryAppointment"; return obj }),
                    ...rawTemplates.OtherContributions.map(obj => { obj["template type"] = "OtherContribution"; return obj }),
                    ...rawTemplates.OtherIndividualAchievements.map(obj => { obj["template type"] = "OtherIndividualAchievement"; return obj }),
                    ...rawTemplates.Conclusions.map(obj => { obj["template type"] = "Conclusion"; return obj }),
                ]

                const updated_template_data = all_templates.map(obj => {
                    const withoutTranscript = obj["template type"] == "PrimaryAppointmentAchievement" || obj["template type"] == "PreUnitAchievement"

                    const inserted_placeholders_transcript = withoutTranscript ? [] : [...obj.transcripttemplate.matchAll(/\{[^}]+\}/g)].map(obj => obj[0].slice(1, -1).toLowerCase()) // global search                    
                    obj.transcripttemplate = withoutTranscript ? undefined : obj.transcripttemplate.replace(regex, `{${name}}`)

                    const inserted_placeholders_testimonial = [...obj.template.matchAll(/\{[^}]+\}/g)].map(obj => obj[0].slice(1, -1).toLowerCase()) // global search                          
                    obj.template = obj.template.replace(regex, `{${name}}`)

                    if (inserted_placeholders_transcript.includes(previouslySavedName.toLowerCase()) ||
                        inserted_placeholders_testimonial.includes(previouslySavedName.toLowerCase())) {
                        return obj
                    }
                }).filter(data => data) // Remove undefined elements

                // Update the database with the templates containing the updated placeholder.
                await Promise.all([
                    ...updated_template_data.map(data => {
                        const templateType = data["template type"]
                        data["template type"] = undefined // remove it before passing data in
                        return prisma[templateType].update({
                            where: {
                                id: data.id
                            },
                            data: data
                        })
                    })
                ])

                res.status(200).json({ message: 'Save Successful' })
                break

            case "POST":
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        PersonalParticularsFields: {
                            create: personalParticularsField
                        }
                    }
                })
                res.status(200).json({ message: 'Creation Successful' })
                break


            default:
                break
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }

}