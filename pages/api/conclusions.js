import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"

const personal_particulars = ["Rank", "Full Name", "Surname", "Enlistment Date", "Coy", "Primary Appointment"]

export default async function handler(req, res) {
    if (req.method != "GET") {
        // 'GET' requests have no 'body'
        var { unit, id, template, transcript_template, related_vocation_ranks } = req.body
    }
    if (req.method == 'POST' || req.method == 'PUT') {
        // Parameter Validation
        if (!transcript_template) {
            return res.status(400).json({ message: 'The transcript template is missing' })
        }        
        if (!template) {
            return res.status(400).json({ message: 'The testimonial template is missing' })
        }
        if (Object.keys(related_vocation_ranks).every(rank => related_vocation_ranks[rank].length == 0)) {
            return res.status(400).json({ message: 'This Conclusion template must be assigned to at least 1 vocation-rank combination' })
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
                const unit_conclusions_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        Conclusions: {
                            include: {
                                appliesto: true
                            }
                        }
                    }
                })
                const unit_conclusions = unit_conclusions_dict.Conclusions
                console.log(unit_conclusions)
                if (unit_conclusions.length < 1) {
                    var init_conclusions_list = [{
                        id: uuidv4(),
                        template: "",
                        previously_saved_template: "",
                        transcript_template: "",
                        previously_saved_transcript_template: "",                        
                        related_vocation_ranks:{},
                        previously_saved_related_vocation_ranks: {},
                        button_state: "save",
                        display: "block"
                    }]
                } else {
                    var init_conclusions_list  = unit_conclusions.map((conclusion) => {
                        const applies_to_vocation_ranks_entries = conclusion.appliesto.map(obj => [obj.vocation, obj.rank])
                        const related_vocation_ranks = Object.fromEntries(applies_to_vocation_ranks_entries)
                        Object.keys(related_vocation_ranks).forEach(vocation => {
                            if (typeof related_vocation_ranks[vocation] !== Array) {
                                related_vocation_ranks[vocation] = [related_vocation_ranks[vocation]]
                            }
                        })
                        return {
                            id: conclusion.id,
                            template: conclusion.template,
                            previously_saved_template: conclusion.template,
                            transcript_template: conclusion.transcripttemplate,
                            previously_saved_transcript_template: conclusion.transcripttemplate,                            
                            related_vocation_ranks: related_vocation_ranks,
                            previously_saved_related_vocation_ranks: related_vocation_ranks,
                            button_state: "edit",
                            display: "block"
                        }
                    })
                }
                res.status(200).json({ init_conclusions_list, message: "Conclusions Successfully Retrieved" })
                break

            case "POST":
                // Create a new Conclusion Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        Conclusions: {
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
                // Update the old Conclusion object
                await prisma.Conclusion.update({
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
                // Delete the Conclusion object if it exists
                const Conclusion_exists = await prisma.Conclusion.findUnique({
                    where: {
                        id: id
                    }
                })
                if (Conclusion_exists) {
                    await prisma.Conclusion.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, Conclusion-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the Conclusion/rank to all of its templates. 
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
