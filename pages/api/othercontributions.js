import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"
import { authenticate, tokenExpiredMessage } from "@/src/authentication";

export default async function handler(req, res) {

    if (req.method != "GET") {
        // 'GET' requests have no 'body'
        var { unit, id, contribution, template, transcript_template, related_vocation_ranks } = req.body
    } else {
        var { unit } = req.query
    }

    var cookie = req.cookies["AdminAuth"]

    let authenticated = authenticate(unit, cookie)
    if (!authenticated) {
        return res.status(401).json({ message: tokenExpiredMessage });
    }

    const response = await prisma.PersonalParticularsField.findMany({
        where: {
            unitName: unit
        }, orderBy: {
            order: 'asc',
        },
    })
    const personal_particulars = response.map(obj => obj.name.toLowerCase())

    if (req.method == 'POST' || req.method == 'PUT') {
        // Parameter Validation     
        if (!contribution) {
            return res.status(400).json({ message: 'The contribution is missing' })
        }
        if (Object.keys(related_vocation_ranks).every(rank => related_vocation_ranks[rank].length == 0)) {
            return res.status(400).json({ message: 'This contribution must be assigned to at least 1 vocation-rank combination' })
        }
        if (!transcript_template) {
            return res.status(400).json({ message: 'The transcript template is missing' })
        }
        if (!template) {
            return res.status(400).json({ message: 'The testimonial template is missing' })
        }
        
        // Placeholder Validation
        const valid_placholders = [...personal_particulars, "Primary Appointment"].map(str => str.toLowerCase())        

        const inserted_placeholders_transcript = [...transcript_template.matchAll(/\{[^}]+\}/g)] // global search
        const inserted_placeholders_testimonial = [...template.matchAll(/\{[^}]+\}/g)] // global search        
        // Check if there are any unpaired { or }
        const num_open_curly_transcript = [...transcript_template.matchAll(/\{/g)].length
        const num_close_curly_transcript = [...transcript_template.matchAll(/\}/g)].length
        if (num_open_curly_transcript < num_close_curly_transcript){
            return res.status(400).json({ message: `At least 1 unpaired '}' was detected in the *transcript* 
                                                    Either pair it with a '{' or remove the unpaired '}'` })
        } else if (num_open_curly_transcript > num_close_curly_transcript) {
            return res.status(400).json({ message: `At least 1 unpaired '{' was detected in the *transcript* 
                                                    Either pair it with a '}' or remove the unpaired '{'` })
        } else if (inserted_placeholders_transcript.length !== num_open_curly_transcript){
            return res.status(400).json({ message: `At least 1 unpaired '{' was detected in the *transcript* 
                                                    Either pair it with a '}' or remove the unpaired '{'` })            
        }        
        const num_open_curly_testimonial = [...template.matchAll(/\{/g)].length
        const num_close_curly_testimonial = [...template.matchAll(/\}/g)].length
        if (num_open_curly_testimonial < num_close_curly_testimonial){
            return res.status(400).json({ message: `At least 1 unpaired '}' was detected in the *testimonial* 
                                                    Either pair it with a '{' or remove the unpaired '}'` })
        } else if (num_open_curly_testimonial > num_close_curly_testimonial) {
            return res.status(400).json({ message: `At least 1 unpaired '{' was detected in the *testimonial* 
                                                    Either pair it with a '}' or remove the unpaired '{'` })
        } else if (inserted_placeholders_testimonial.length !== num_open_curly_testimonial){
            return res.status(400).json({ message: `At least 1 unpaired '{' was detected in the *testimonial* 
                                                    Either pair it with a '}' or remove the unpaired '{'` })            
        }             
        // Check if the placholders are valid        
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
        // Check if there are any unpaired < or > 
        const num_red_coloured_insertions_transcript =  [...transcript_template.matchAll(/\<[^\>]+\>/g)]
        const num_less_than_transcript = [...transcript_template.matchAll(/\</g)].length
        const num_greater_than_transcript = [...transcript_template.matchAll(/\>/g)].length
        if (num_less_than_transcript < num_greater_than_transcript){
            return res.status(400).json({ message: `At least 1 unpaired '>' was detected in the *transcript* 
                                                    Either pair it with a '<' or remove the unpaired '>'` })
        } else if (num_less_than_transcript > num_greater_than_transcript) {
            return res.status(400).json({ message: `At least 1 unpaired '<' was detected in the *transcript* 
                                                    Either pair it with a '>' or remove the unpaired '<'` })
        } else if (num_red_coloured_insertions_transcript.length !== num_less_than_transcript){
            return res.status(400).json({ message: `At least 1 unpaired '<' was detected in the *transcript* 
                                                    Either pair it with a '>' or remove the unpaired '<'` })       
        }  
        const num_red_coloured_insertions_testimonial =   [...template.matchAll(/\<[^\>]+\>/g)]
        const num_less_than_testimonial = [...template.matchAll(/\</g)].length
        const num_greater_than_testimonial = [...template.matchAll(/\>/g)].length 
        if (num_less_than_testimonial < num_greater_than_testimonial){
            return res.status(400).json({ message: `At least 1 unpaired '>' was detected in the *testimonial* 
                                                    Either pair it with a '<' or remove the unpaired '>'` })
        } else if (num_less_than_testimonial > num_greater_than_testimonial) {
            return res.status(400).json({ message: `At least 1 unpaired '<' was detected in the *testimonial* 
                                                    Either pair it with a '>' or remove the unpaired '<'` })
        } else if (num_red_coloured_insertions_testimonial.length !== num_less_than_testimonial){
            return res.status(400).json({ message: `At least 1 unpaired '<' was detected in the *testimonial* 
                                                    Either pair it with a '>' or remove the unpaired '<'` })           
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
                const unit_other_contributions_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        OtherContributions: {
                            include: {
                                appliesto: true
                            }
                        }
                    }
                })
                const unit_other_contributions = unit_other_contributions_dict.OtherContributions
                console.log(unit_other_contributions)
                if (unit_other_contributions.length < 1) {
                    var init_list = [{
                        id: uuidv4(),
                        contribution: "",
                        previously_saved_contribution: "",
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
                    var init_list = unit_other_contributions.map((other_contribution) => {
                        let related_vocation_ranks = {}
                        other_contribution.appliesto.forEach(obj => {
                            if (related_vocation_ranks.hasOwnProperty(obj.vocation)){
                                related_vocation_ranks[obj.vocation].push(obj.rank)
                            } else {
                                related_vocation_ranks[obj.vocation] = [obj.rank]
                            }
                        })
                        return {
                            id: other_contribution.id,
                            contribution: other_contribution.title,
                            previously_saved_contribution: other_contribution.title,
                            template: other_contribution.template,
                            previously_saved_template: other_contribution.template,
                            transcript_template: other_contribution.transcripttemplate,
                            previously_saved_transcript_template: other_contribution.transcripttemplate,
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
                // Create a new OtherContribution Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        OtherContributions: {
                            create: {
                                id: id,
                                title: contribution,
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
                // Update the old OtherContribution object
                console.log(related_vocation_ranks_ids)
                await prisma.OtherContribution.update({
                    where: {
                        id: id
                    },
                    data: {
                        title: contribution,
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
                // Delete the OtherContribution object and its related achievements if it exists
                const OtherContribution_exists = await prisma.OtherContribution.findUnique({
                    where: {
                        id: id
                    }
                })
                if (OtherContribution_exists) {
                    await prisma.OtherContribution.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, OtherContribution-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the OtherContribution/rank to all of its templates. 
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
