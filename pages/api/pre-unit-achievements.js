import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"

const personal_particulars = ["Rank", "Full Name", "Surname", "Enlistment Date", "Coy", "Primary Appointment"]

export default async function handler(req, res) {
    if (req.method !== "GET") {
        // 'GET' requests have no 'body'
        var { unit, id, achievement_title, previously_saved_achievement_title, achievement_wording } = req.body

        let introductions_raw = await prisma.Unit.findUnique({
            where: {
                name: unit
            },
            select: {
                Introductions: true
            }
        })
        var introductions = introductions_raw.Introductions.map(obj => ({ id: obj.id, template: obj.template, transcript: obj.transcript }))
    }
    if (req.method == 'DELETE') {
        // Block the deletion if the pre-unit achievement has been inserted into an Introduction template
        for (let i = 0; i < introductions.length; i++) {
            const inserted_placeholders_testimonial = [...introductions[i]['template'].matchAll(/\{[^}]+\}/g)] // global search 
                .map(obj => obj[0].slice(1, -1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
            if (inserted_placeholders_testimonial.includes(achievement_title.toLowerCase())) {
                return res.status(400).json({
                    message: `*'${achievement_title}' cannot be deleted as it is used in the below Introduction Template.*
                                                        
                                                        "${introductions[i]['template']}"

                                                        *If you want to delete '${achievement_title}', you must remove it from the above Introduction Template first.*
                                                        *(Remember to click 'Save')*`
                })
            }
            const inserted_placeholders_transcript = [...introductions[i]['transcript'].matchAll(/\{[^}]+\}/g)] // global search 
                .map(obj => obj[0].slice(1, -1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
            if (inserted_placeholders_transcript.includes(achievement_title.toLowerCase())) {
                return res.status(400).json({
                    message: `*'${achievement_title}' cannot be deleted as it is used in the below Introduction Template.*
                                                        
                                                        "${introductions[i]['template']}"

                                                        *If you want to delete '${achievement_title}', you must remove it from the above Introduction Template first.*
                                                        *(Remember to click 'Save')*`
                })
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
        // Uniqueness validation
        const existing_achievement_titles = await prisma.PreUnitAchievement.findMany({
            where: {
                NOT: {id: id},
                unitName: unit
            },
            select: {
                title: true
            }
        })
        if (existing_achievement_titles.map(obj => obj.title.toLowerCase()).includes(achievement_title.toLowerCase())) {
            return res.status(400).json({ message: `'${achievement_title}' already exists.` })
        }
        // Placeholder Validation
        const valid_placholders = personal_particulars.map(str => str.toLowerCase())
        const inserted_placeholders_wording = [...achievement_wording.matchAll(/\{[^}]+\}/g)] // global search
        // Check if there are any unpaired { or }
        const num_open_curly_wording = [...achievement_wording.matchAll(/\{/g)].length
        const num_close_curly_wording = [...achievement_wording.matchAll(/\}/g)].length
        if (num_open_curly_wording < num_close_curly_wording) {
            return res.status(400).json({
                message: `At least 1 unpaired '}' was detected 
                                                    Either pair it with a '{' or remove the unpaired '}'` })
        } else if (num_open_curly_wording > num_close_curly_wording) {
            return res.status(400).json({
                message: `At least 1 unpaired '{' was detected 
                                                    Either pair it with a '}' or remove the unpaired '{'` })
        } else if (inserted_placeholders_wording.length !== num_open_curly_wording) {
            return res.status(400).json({
                message: `At least 1 unpaired '{' was detected 
                                                    Either pair it with a '}' or remove the unpaired '{'` })
        }
        // Check if the placholders are valid                   
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
        // Check if there are any unpaired < or > 
        const num_red_coloured_insertions_wording = [...achievement_wording.matchAll(/\<[^\>]+\>/g)]
        const num_less_than_wording = [...achievement_wording.matchAll(/\</g)].length
        const num_greater_than_wording = [...achievement_wording.matchAll(/\>/g)].length
        if (num_less_than_wording < num_greater_than_wording) {
            return res.status(400).json({
                message: `At least 1 unpaired '>' was detected 
                                                    Either pair it with a '<' or remove the unpaired '>'` })
        } else if (num_less_than_wording > num_greater_than_wording) {
            return res.status(400).json({
                message: `At least 1 unpaired '<' was detected 
                                                    Either pair it with a '>' or remove the unpaired '<'` })
        } else if (num_red_coloured_insertions_wording.length !== num_less_than_wording) {
            return res.status(400).json({
                message: `At least 1 unpaired '<' was detected 
                                                    Either pair it with a '>' or remove the unpaired '<'` })
        }
        // Get the related vocation ranks of the Introductions which contain this pre-unit achievement 
        const related_introductions_ids = introductions.map(introduction => {
            const inserted_placeholders_testimonial = [...introduction['template'].matchAll(/\{[^}]+\}/g)] // global search 
                .map(obj => obj[0].slice(1, -1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
            if (inserted_placeholders_testimonial.includes(achievement_title.toLowerCase())) {
                return { id: introduction.id }
            }
            const inserted_placeholders_transcript = [...introduction['transcript'].matchAll(/\{[^}]+\}/g)] // global search 
                .map(obj => obj[0].slice(1, -1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
            if (inserted_placeholders_transcript.includes(achievement_title.toLowerCase())) {
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
                previously_saved_achievement_title = previously_saved_achievement_title.toLowerCase()
                achievement_title = achievement_title.toLowerCase()
                if (previously_saved_achievement_title !== achievement_title) {
                    // If the title has been edited, update it in all related introductions too
                    const all_introductions = await prisma.Introduction.findMany({
                        where: {
                            unitName: unit
                        }
                    })
                    const updated_introductions_data = all_introductions.map(obj=>{
                        const inserted_placeholders_transcript = [...obj.transcripttemplate.matchAll(/\{[^}]+\}/g)].map(obj=> obj[0].slice(1,-1).toLowerCase()) // global search
                        if (inserted_placeholders_transcript.includes(previously_saved_achievement_title)) {
                            var regex = new RegExp(`{${previously_saved_achievement_title}}`, 'gi') // Case insensitive replacement
                            obj.transcripttemplate = obj.transcripttemplate.replace(regex, `{${achievement_title}}`)
                        }
                        const inserted_placeholders_testimonial = [...obj.template.matchAll(/\{[^}]+\}/g)].map(obj=> obj[0].slice(1,-1).toLowerCase()) // global search                          
                        if (inserted_placeholders_testimonial.includes(previously_saved_achievement_title)) {
                            var regex = new RegExp(`{${previously_saved_achievement_title}}`, 'gi') // Case insensitive replacement                           
                            obj.template = obj.template.replace(regex, `{${achievement_title}}`)
                        }  
                        if (inserted_placeholders_transcript.includes(previously_saved_achievement_title) ||
                            inserted_placeholders_testimonial.includes(previously_saved_achievement_title)) {
                                return obj
                            }
                    }).filter(data=>data) // Remove undefined elements
                    if (updated_introductions_data.length > 0){
                        // Update the database with the Introductions containing the updated placeholder.
                        await Promise.all(updated_introductions_data.map(data=>{
                            return prisma.Introduction.update({
                                where: {
                                    id: data.id
                                },
                                data: data
                            })
                        }))
                    }
                }
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
