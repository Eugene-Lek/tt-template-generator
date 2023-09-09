import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"

const personal_particulars = ["rank", "full Name", "surname", "enlistment Date", "coy", "primary appointment"].map(e=>e.toLowerCase())

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

        const inserted_placeholders_transcript = [...transcript_template.matchAll(/\{[^}]+\}/g)].map(obj=> obj[0].slice(1,-1).toLowerCase()) //slice to remove the braces
        const inserted_placeholders_testimonial = [...template.matchAll(/\{[^}]+\}/g)].map(obj=> obj[0].slice(1,-1).toLowerCase()) //slice to remove the braces        
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
            const candidate_placeholder = inserted_placeholders_transcript[i]
            if (!valid_placholders.includes(candidate_placeholder)){
                return res.status(400).json({ message: `{${candidate}} was found in the Transcript template, but '${candidate}' is neither a Personal Particular nor Pre-Unit Achievement.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")} 
                                                        
                                                        *Pre-Unit Achievements (case-insensitive):*
                                                        ${pre_unit_achievements.join(", ")}` 
                    }
                )
            }
        }
        for (let i=0; i<inserted_placeholders_testimonial.length; i++){
            const candidate_placeholder = inserted_placeholders_testimonial[i]
            if (!valid_placholders.includes(candidate_placeholder)){
                return res.status(400).json({ message: `{${candidate_placeholder}} was found in the Testimonial template, but '${candidate_placeholder}' is not a Personal Particular.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")}
                                                        
                                                        *Pre-Unit Achievements (case-insensitive):*
                                                        ${pre_unit_achievements.join(", ")}`
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
        // Find the Pre-Unit Achievements associated with the transcript/testimonial so they can be connected to the same VRC objects
        const inserted_pre_unit_achievements = [... new Set([...inserted_placeholders_transcript, ...inserted_placeholders_testimonial])]
                                                .filter(placeholder=>!personal_particulars.includes(placeholder))   
        console.log(inserted_pre_unit_achievements)
        const all_pre_unit_achievements = await prisma.PreUnitAchievement.findMany({
            where: {
                unitName: unit
            },
            select: {
                id: true,
                title: true
            }
        })        
        await Promise.all(all_pre_unit_achievements.map(obj=>{
            if (inserted_pre_unit_achievements.includes(obj.title.toLowerCase())){
                // If inside, connect
                return prisma.PreUnitAchievement.update({
                    where:{
                        id: obj.id
                    },
                    data: {
                        appliesto: {
                            connect: related_vocation_ranks_ids
                        }
                    }
                })                  
            } else {
                // If not inside, disconnect. This works because each VRC can only be assigned to 1 introduction, so 
                // there will never be a situation where a Pre-Unit Achievement is linked to a VRC via 2 sources and 
                // disconnected from the VRC just because it is removed from 1 source. 
                return prisma.PreUnitAchievement.update({
                    where:{
                        id: obj.id
                    },
                    data: {
                        appliesto: {
                            disconnect: related_vocation_ranks_ids
                        }
                    }
                })                  
            }
        }))
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
                if (unit_introductions.length < 1) {
                    var init_introductions_list = [{
                        id: uuidv4(),
                        template: "",
                        previously_saved_template: "",
                        transcript_template: "",
                        previously_saved_transcript_template: "",
                        related_vocation_ranks: {},
                        previously_saved_related_vocation_ranks: {},
                        previously_saved_pre_unit_achievements: [],
                        button_state: "save",
                        display: "block"
                    }]
                } else {
                    var init_introductions_list = unit_introductions.map((introduction) => {
                        let related_vocation_ranks = {}
                        introduction.appliesto.forEach(obj => {
                            if (related_vocation_ranks.hasOwnProperty(obj.vocation)){
                                related_vocation_ranks[obj.vocation].push(obj.rank)
                            } else {
                                related_vocation_ranks[obj.vocation] = [obj.rank]
                            }
                        })
                        const inserted_placeholders_transcript = [...introduction.transcripttemplate.matchAll(/\{[^}]+\}/g)].map(obj=> obj[0].slice(1,-1).toLowerCase()) //slice to remove the braces
                        const inserted_placeholders_testimonial = [...introduction.template.matchAll(/\{[^}]+\}/g)].map(obj=> obj[0].slice(1,-1).toLowerCase()) //slice to remove the braces
                        const inserted_pre_unit_achievements = [... new Set([...inserted_placeholders_transcript, ...inserted_placeholders_testimonial])]
                                                                .filter(placeholder=>!personal_particulars.includes(placeholder)) 
                        return {
                            id: introduction.id,
                            template: introduction.template,
                            previously_saved_template: introduction.template,
                            transcript_template: introduction.transcripttemplate,
                            previously_saved_transcript_template: introduction.transcripttemplate,
                            related_vocation_ranks: related_vocation_ranks,
                            previously_saved_related_vocation_ranks: related_vocation_ranks,
                            previously_saved_pre_unit_achievements: inserted_pre_unit_achievements,                            
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
