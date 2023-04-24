import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"

const personal_particulars = ["Rank", "Full Name", "Surname", "Enlistment Date", "Coy", "Primary Appointment"]

export default async function handler(req, res) {
    if (req.method != "GET") {
        // 'GET' requests have no 'body'
        var { unit, id, achievement_title, achievement_wording } = req.body

        let introductions_raw = await prisma.Unit.findUnique({
            where: {
                name: unit
            },
            select: {
                Introductions: true
            }
        })
        var introductions = introductions_raw.Introductions.map(obj => ({ id: obj.id, template: obj.template }))
    }
    if (req.method == 'DELETE') {
        // Block the deletion if the pre-unit achievement has been inserted into an Introduction template
        for (let i = 0; i < introductions.length; i++) {
            const inserted_placeholders_wording = [...introductions[i]['template'].matchAll(/\{[^}]+\}/g)] // global search 
                .map(obj => obj[0].slice(1, -1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
            if (inserted_placeholders_wording.includes(achievement_title.toLowerCase())) {
                return res.status(400).json({
                    message: `*'${achievement_title}' cannot be deleted as it is used in the below Introduction Template.*
                                                        
                                                        "${introductions[i]['template']}"

                                                        *If you want to delete '${achievement_title}', you must remove it from the above Introduction Template first.*
                                                        *(Remember to click 'Save')*`
                }
                )
            }
        }

    }
    if (req.method == 'POST' || req.method == 'PUT') {
        // Input Validation
        if (!achievement_title) {
            return res.status(400).json({ message: 'The title is missing' })
        }
        if (!achievement_wording) {
            return res.status(400).json({ message: 'The wording is missing' })
        }
        // Placeholder Validation
        const valid_placholders = personal_particulars.map(str => str.toLowerCase())
        const inserted_placeholders_wording = [...achievement_wording.matchAll(/\{[^}]+\}/g)] // global search
        for (let i = 0; i < inserted_placeholders_wording.length; i++) {
            const candidate_data = inserted_placeholders_wording[i]
            const candidate = candidate_data[0].slice(1, -1) // index 0 corresponds to the actual match detected. The rest is metadata
            if (!valid_placholders.includes(candidate.toLowerCase())) {
                return res.status(400).json({
                    message: `{${candidate}} was found in the wording, but '${candidate}' is not a Personal Particular.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")}`
                }
                )
            }
        }
        // Get the related vocation ranks of the Introductions which contain this pre-unit achievement 
        const related_introductions_ids = introductions.map(introduction => {
            const inserted_placeholders_wording = [...introduction['template'].matchAll(/\{[^}]+\}/g)] // global search 
                .map(obj => obj[0].slice(1, -1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
            if (inserted_placeholders_wording.includes(achievement_title.toLowerCase())) {
                return { id: introduction.id }
            }
        }).filter(id => id) // Remove undefined elements
        const related_vocation_ranks_ids_dict = await prisma.Introduction.findMany({
            where: {
                OR: related_introductions_ids
            },
            select: {
                appliesto: {
                    select: {
                        id: true
                    }
                }
            }
        })
        var related_vocation_ranks_ids = [].concat(...related_vocation_ranks_ids_dict.map(intro => {
            return intro.appliesto.map(obj => ({ id: obj.id }))
        }))
    }

    try {
        switch (req.method) {
            case "GET":
                const unit_pre_unit_achievements_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        PreUnitAchievements: true
                    }
                })
                const unit_pre_unit_achievements = unit_pre_unit_achievements_dict.PreUnitAchievements
                if (unit_pre_unit_achievements.length < 1) {
                    var init_list = [{
                        id: uuidv4(),
                        achievement_title: '',
                        previously_saved_achievement_title: '',
                        achievement_wording: '',
                        previously_saved_achievement_wording: '',
                        button_state: "save",
                        display: 'block'
                    }]
                } else {
                    var init_list = unit_pre_unit_achievements.map((pre_unit_achievement) => {
                        return {
                            id: pre_unit_achievement.id,
                            achievement_title: pre_unit_achievement.title,
                            previously_saved_achievement_title: pre_unit_achievement.title,
                            achievement_wording: pre_unit_achievement.template,
                            previously_saved_achievement_wording: pre_unit_achievement.template,
                            button_state: "edit",
                            display: 'block'
                        }
                    })
                }
                res.status(200).json({ init_list, message: "Introdutions Successfully Retrieved" })
                break

            case "POST":
                // Create a new PreUnitAchievement Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        PreUnitAchievements: {
                            create: {
                                id: id,
                                title: achievement_title,
                                template: achievement_wording,
                                appliesto: {
                                    connect: related_vocation_ranks_ids
                                }
                            }
                        }
                    }
                })

                res.status(200).json({ message: 'Save Successful' })
                break

            case 'PUT':
                // Update the old PreUnitAchievement object
                await prisma.PreUnitAchievement.update({
                    where: {
                        id: id
                    },
                    data: {
                        title: achievement_title,
                        template: achievement_wording,
                        appliesto: {
                            set: related_vocation_ranks_ids
                        }
                    }
                })
                res.status(200).json({ message: 'Save Successful' })
                break

            case 'DELETE':
                // Delete the PreUnitAchievement object if it exists
                const PreUnitAchievement_exists = await prisma.PreUnitAchievement.findUnique({
                    where: {
                        id: id
                    }
                })
                if (PreUnitAchievement_exists) {
                    await prisma.PreUnitAchievement.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, PreUnitAchievement-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the PreUnitAchievement/rank to all of its templates. 
                res.status(200).json({ message: 'Delete Successful' })
                break

            default:
                break
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}