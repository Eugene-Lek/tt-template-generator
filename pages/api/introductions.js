import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"

const personal_particulars = ["Rank", "Full Name", "Surname", "Enlistment Date", "Coy", "Primary Appointment"]

export default async function handler(req, res) {
    if (req.method != "GET") {
        // 'GET' requests have no 'body'
        var { unit, id, template, transcript_template, related_vocation_ranks } = req.body
    }
    if (req.method == 'POST' || req.method == 'PUT') {
        // General Parameter Validation
        if (!transcript_template) {
            return res.status(400).json({ message: 'The transcript template is missing' })
        }
        if (!template) {
            return res.status(400).json({ message: 'The testimonial template is missing' })
        }
        if (Object.keys(related_vocation_ranks).every(rank => related_vocation_ranks[rank].length == 0)) {
            return res.status(400).json({ message: 'This Introduction template must be assigned to at least 1 vocation-rank combination' })
        }
        // Placeholder Validation
        let pre_unit_achievements = await prisma.Unit.findUnique({
            where: {
                name: unit
            },
            select: {
                PreUnitAchievements: true
            }
        })
        pre_unit_achievements = pre_unit_achievements.PreUnitAchievements.map(obj=>obj.title)
        const valid_placholders = [...personal_particulars, ...pre_unit_achievements].map(str => str.toLowerCase())

        const inserted_placeholders_transcript = [...transcript_template.matchAll(/\{[^}]+\}/g)] // global search
        console.log(inserted_placeholders_transcript)
        for (let i=0; i<inserted_placeholders_transcript.length; i++){
            const candidate_data = inserted_placeholders_transcript[i]
            const candidate = candidate_data[0].slice(1,-1) // index 0 corresponds to the actual match detected. The rest is metadata
            if (!valid_placholders.includes(candidate.toLowerCase())){
                return res.status(400).json({ message: `{${candidate}} was found in the Transcript template, but '${candidate}' is neither a Personal Particular nor Pre-Unit Achievement.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")} 
                                                        
                                                        *Pre-Unit Achievements (case-insensitive):*
                                                        ${pre_unit_achievements.join(", ")}` 
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
                                                        ${personal_particulars.join(", ")}
                                                        
                                                        *Pre-Unit Achievements (case-insensitive):*
                                                        ${pre_unit_achievements.join(", ")}`
                    }
                )
            }
        }     
        // Find related Vocation-Rank-Combination objects via related_vocation_ranks_list
        const related_vocation_ranks_nested_list = Object.keys(related_vocation_ranks).map((rank_type) => {
            return related_vocation_ranks[rank_type].map((vocation) => {
                return { vocation, rank: rank_type, unitName: unit }
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
                const unit_introductions_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        Introductions: {
                            include: {
                                appliesto: true
                            }
                        }
                    }
                })
                const unit_introductions = unit_introductions_dict.Introductions
                console.log(unit_introductions)
                if (unit_introductions.length < 1) {
                    var init_introductions_list = [{
                        id: uuidv4(),
                        template: "",
                        previously_saved_template: "",
                        transcript_template: "",
                        previously_saved_transcript_template: "",
                        related_vocation_ranks: {
                            Officer: [],
                            Specialist: [],
                            Enlistee: []
                        },
                        previously_saved_related_vocation_ranks: {
                            Officer: [],
                            Specialist: [],
                            Enlistee: []
                        },
                        button_state: "save",
                        display: "block"
                    }]
                } else {
                    var init_introductions_list = unit_introductions.map((introduction) => {
                        const applies_to_VRC = introduction.appliesto
                        const applies_to_officers = applies_to_VRC.filter((vrc) => vrc.rank == "Officer").map((vrc) => vrc.vocation)
                        const applies_to_specialists = applies_to_VRC.filter((vrc) => vrc.rank == "Specialist").map((vrc) => vrc.vocation)
                        const applies_to_enlistee = applies_to_VRC.filter((vrc) => vrc.rank == "Enlistee").map((vrc) => vrc.vocation)

                        return {
                            id: introduction.id,
                            template: introduction.template,
                            previously_saved_template: introduction.template,
                            transcript_template: introduction.transcripttemplate,
                            previously_saved_transcript_template: introduction.transcripttemplate,
                            related_vocation_ranks: {
                                Officer: applies_to_officers,
                                Specialist: applies_to_specialists,
                                Enlistee: applies_to_enlistee
                            },
                            previously_saved_related_vocation_ranks: {
                                Officer: applies_to_officers,
                                Specialist: applies_to_specialists,
                                Enlistee: applies_to_enlistee
                            },
                            button_state: "edit",
                            display: "block"
                        }
                    })
                }
                res.status(200).json({ init_introductions_list, message: "Introdutions Successfully Retrieved" })
                break

            case "POST":
                // Create a new Introduction Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        Introductions: {
                            create: {
                                id: id,
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
                // Update the old Introduction object
                await prisma.Introduction.update({
                    where: {
                        id: id
                    },
                    data: {
                        template: template,
                        transcripttemplate: transcript_template,
                        appliesto: {
                            set: related_vocation_ranks_ids
                        }
                    }
                })
                res.status(200).json({ message: 'Save Successful' })
                break

            case 'DELETE':
                // Delete the Introduction object if it exists
                const Introduction_exists = await prisma.Introduction.findUnique({
                    where: {
                        id: id
                    }
                })
                if (Introduction_exists) {
                    await prisma.Introduction.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, Introduction-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the Introduction/rank to all of its templates. 
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
