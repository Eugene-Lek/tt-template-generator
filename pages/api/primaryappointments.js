import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"
import { authenticate, tokenExpiredMessage } from "@/src/authentication";

export default async function handler(req, res) {

    if (req.method != "GET") {
        // 'GET' requests have no 'body'
        var { unit, id, appointment, template, transcript_template, related_vocation_ranks } = req.body
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
        if (!appointment) {
            return res.status(400).json({ message: 'The appointment is missing' })
        }
        if (Object.keys(related_vocation_ranks).every(rank => related_vocation_ranks[rank].length == 0)) {
            return res.status(400).json({ message: 'This appointment must be assigned to at least 1 vocation-rank combination' })
        }
        if (!transcript_template) {
            return res.status(400).json({ message: 'The transcript template is missing' })
        }        
        if (!template) {
            return res.status(400).json({ message: 'The testimonial template is missing' })
        }
        // Placeholder Validation
        let primary_appointment_achievements = await prisma.PrimaryAppointment.findUnique({
            where: {
                id: id
            },
            select: {
                achievements: true
            }
        })
        if (!primary_appointment_achievements){
            // If the result is null because the primary appointment does not exist yet, assign primary_appointment_achievements to an object with an empty array
            primary_appointment_achievements = {achievements: []}
        }
        primary_appointment_achievements = primary_appointment_achievements.achievements.map(obj=>obj.title)
        const valid_placholders = [...personal_particulars, ...primary_appointment_achievements].map(str => str.toLowerCase())

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
                return res.status(400).json({ message: `{${candidate_placeholder}} was found in the Transcript template, but '${candidate_placeholder}' is neither a Personal Particular nor Related Achievement.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")}
                                                        
                                                        *Related Achievements (case-insensitive):*
                                                        ${primary_appointment_achievements.join(", ")}` 
                    }
                )
            }
        }        
        const primary_appointment_achievements_string = primary_appointment_achievements.length > 0 ? primary_appointment_achievements.join(", ") : "None Added"
        for (let i=0; i<inserted_placeholders_testimonial.length; i++){
            const candidate_placeholder_data = inserted_placeholders_testimonial[i]
            const candidate_placeholder = candidate_placeholder_data[0].slice(1,-1) // index 0 corresponds to the actual match detected. The rest is metadata
            if (!valid_placholders.includes(candidate_placeholder.toLowerCase())){
                return res.status(400).json({ message: `{${candidate_placeholder}} was found in the Testimonial template, but '${candidate_placeholder}' is neither a Personal Particular nor Related Achievement.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")}
                                                        
                                                        *Related Achievements (case-insensitive):*
                                                        ${primary_appointment_achievements_string}`
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
            return res.status(400).json({ message: `At least 1 unpaired '<' was detected in the *testimonial* 
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
                const unit_primary_appointments_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        PrimaryAppointments: {
                            include: {
                                appliesto: true,
                                achievements: true
                            }
                        }
                    }
                })
                const unit_primary_appointments = unit_primary_appointments_dict.PrimaryAppointments
                console.log(unit_primary_appointments)
                if (unit_primary_appointments.length < 1) {
                    var init_list = [{
                        id: uuidv4(),
                        appointment: "",
                        previously_saved_appointment: "",
                        template: "",
                        previously_saved_template: "",
                        transcript_template: "",
                        previously_saved_transcript_template: "",                        
                        related_vocation_ranks: {},
                        previously_saved_related_vocation_ranks: {},
                        previously_saved_related_achievements: [],
                        button_state: "save",
                        display: 'block'
                    }]
                } else {
                    var init_list = unit_primary_appointments.map((primary_appointment) => {
                        let related_vocation_ranks = {}
                        primary_appointment.appliesto.forEach(obj => {
                            if (related_vocation_ranks.hasOwnProperty(obj.vocation)){
                                related_vocation_ranks[obj.vocation].push(obj.rank)
                            } else {
                                related_vocation_ranks[obj.vocation] = [obj.rank]
                            }
                        })
                        return {
                            id: primary_appointment.id,
                            appointment: primary_appointment.title,
                            previously_saved_appointment: primary_appointment.title,
                            template: primary_appointment.template,
                            previously_saved_template: primary_appointment.template,
                            transcript_template: primary_appointment.transcripttemplate,
                            previously_saved_transcript_template: primary_appointment.transcripttemplate,                            
                            related_vocation_ranks: related_vocation_ranks,
                            previously_saved_related_vocation_ranks: related_vocation_ranks,
                            previously_saved_related_achievements: primary_appointment.achievements.map(obj=>obj.title),                            
                            button_state: "edit",
                            display: 'block'
                        }
                    })
                }
                res.status(200).json({ init_list, message: "Introdutions Successfully Retrieved" })
                break

            case "POST":
                // Create a new PrimaryAppointment Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        PrimaryAppointments: {
                            create: {
                                id: id,
                                title: appointment,
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
                // Update the old PrimaryAppointment object
                await prisma.PrimaryAppointment.update({
                    where: {
                        id: id
                    },
                    data: {
                        title: appointment,
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
                // Delete the PrimaryAppointment object and its related achievements if it exists
                const PrimaryAppointment_exists = await prisma.PrimaryAppointment.findUnique({
                    where: {
                        id: id
                    }
                })
                if (PrimaryAppointment_exists) {
                    // The related achievements must be deleted first as all related achievements must have a Primary Appointment.
                    await prisma.PrimaryAppointmentAchievement.deleteMany({
                        where: {
                            primaryappointmentId: id
                        }
                    })
                    await prisma.PrimaryAppointment.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, PrimaryAppointment-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the PrimaryAppointment/rank to all of its templates. 
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
