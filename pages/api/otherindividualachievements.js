import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"

const personal_particulars = ["Rank", "Full Name", "Surname", "Enlistment Date", "Coy", "Primary Appointment"]

export default async function handler(req, res) {
    if (req.method != "GET") {
        // 'GET' requests have no 'body'
        var { unit, id, achievement, template, transcript_template, related_vocation_ranks } = req.body
    }
    if (req.method == 'POST' || req.method == 'PUT') {
        // Parameter Validation     
        if (!achievement) {
            return res.status(400).json({ message: 'The achievement is missing' })
        }
        if (Object.keys(related_vocation_ranks).every(rank => related_vocation_ranks[rank].length == 0)) {
            return res.status(400).json({ message: 'This achievement must be assigned to at least 1 vocation-rank combination' })
        }
        if (!transcript_template) {
            return res.status(400).json({ message: 'The transcript template is missing' })
        }
        if (!template) {
            return res.status(400).json({ message: 'The testimonial template is missing' })
        }
        // Placeholder Validation
        const valid_placholders = [...personal_particulars].map(str => str.toLowerCase())

        const inserted_placeholders_transcript = [...transcript_template.matchAll(/\{[^}]+\}/g)] // global search
        for (let i=0; i<inserted_placeholders_transcript.length; i++){
            const candidate_placeholder_data = inserted_placeholders_transcript[i]
            const candidate_placeholder = candidate_placeholder_data[0].slice(1,-1) // index 0 corresponds to the actual match detected. The rest is metadata
            if (!valid_placholders.includes(candidate_placeholder.toLowerCase())){
                return res.status(400).json({ message: `{${candidate_placeholder}} was found in the Transcript template, but '${candidate_placeholder}' is not a Personal Particular.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")}` 
                    }
                )
            }
        }        
        const inserted_placeholders_testimonial = [...template.matchAll(/\{[^}]+\}/g)] // global search
        for (let i=0; i<inserted_placeholders_testimonial.length; i++){
            const candidate_placeholder_data = inserted_placeholders_testimonial[i]
            const candidate_placeholder = candidate_placeholder_data[0].slice(1,-1) // index 0 corresponds to the actual match detected. The rest is metadata
            if (!valid_placholders.includes(candidate_placeholder.toLowerCase())){
                return res.status(400).json({ message: `{${candidate_placeholder}} was found in the Testimonial template, but '${candidate_placeholder}' is not a Personal Particular.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")}`
                    }
                )
            }
        }             
        // Find related Vocation-Rank-Combination objects via related_vocation_ranks_list
        const related_vocation_ranks_nested_list = Object.keys(related_vocation_ranks).map((vocation) => {
            return related_vocation_ranks[vocation].map((rank) => {
                return { vocation, rank, unitName: unit }
            })
        })
        const related_vocation_ranks_list = [].concat(...related_vocation_ranks_nested_list)
        var related_vocation_ranks_ids = await prisma.VocationRankCombination.findMany({
            where: {
                OR: related_vocation_ranks_list
            },
            select: {
                id: true
            }
        })
    }

    try {
        switch (req.method) {
            case "GET":
                const unit_other_individual_achievements_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        OtherIndividualAchievements: {
                            include: {
                                appliesto: true
                            }
                        }
                    }
                })
                const unit_other_individual_achievements = unit_other_individual_achievements_dict.OtherIndividualAchievements
                console.log(unit_other_individual_achievements)
                if (unit_other_individual_achievements.length < 1) {
                    var init_list = [{
                        id: uuidv4(),
                        achievement: "",
                        previously_saved_achievement: "",
                        template: "",
                        previously_saved_template: "",
                        transcript_template: "",
                        previously_saved_transcript_template: "",
                        related_vocation_ranks: {},
                        previously_saved_related_vocation_ranks: {},
                        button_state: "save",
                        display: 'block'
                    }]
                } else {
                    var init_list = unit_other_individual_achievements.map((other_individual_achievement) => {
                        let related_vocation_ranks = {}
                        other_individual_achievement.appliesto.forEach(obj => {
                            if (related_vocation_ranks.hasOwnProperty(obj.vocation)){
                                related_vocation_ranks[obj.vocation].push(obj.rank)
                            } else {
                                related_vocation_ranks[obj.vocation] = [obj.rank]
                            }
                        })
                        return {
                            id: other_individual_achievement.id,
                            achievement: other_individual_achievement.title,
                            previously_saved_achievement: other_individual_achievement.title,
                            template: other_individual_achievement.template,
                            previously_saved_template: other_individual_achievement.template,
                            transcript_template: other_individual_achievement.transcripttemplate,
                            previously_saved_transcript_template: other_individual_achievement.transcripttemplate,
                            related_vocation_ranks: related_vocation_ranks,
                            previously_saved_related_vocation_ranks: related_vocation_ranks,
                            button_state: "edit",
                            display: 'block'
                        }
                    })
                }
                res.status(200).json({ init_list, message: "Introdutions Successfully Retrieved" })
                break

            case "POST":
                // Create a new OtherIndividualAchievement Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        OtherIndividualAchievements: {
                            create: {
                                id: id,
                                title: achievement,
                                template: template,
                                transcripttemplate: transcript_template,
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
                // Update the old OtherIndividualAchievement object
                await prisma.OtherIndividualAchievement.update({
                    where: {
                        id: id
                    },
                    data: {
                        title: achievement,
                        transcripttemplate: transcript_template,
                        appliesto: {
                            set: related_vocation_ranks_ids
                        }
                    }
                })
                res.status(200).json({ message: 'Save Successful' })
                break

            case 'DELETE':
                // Delete the OtherIndividualAchievement object and its related achievements if it exists
                const OtherIndividualAchievement_exists = await prisma.OtherIndividualAchievement.findUnique({
                    where: {
                        id: id
                    }
                })
                if (OtherIndividualAchievement_exists) {
                    await prisma.OtherIndividualAchievement.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, OtherIndividualAchievement-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the OtherIndividualAchievement/rank to all of its templates. 
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
