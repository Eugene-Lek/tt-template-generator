import prisma from "lib/prisma"

const personal_particulars = ["Rank", "Full Name", "Surname", "Enlistment Date", "Coy", "Primary Appointment"]

export default async function handler(req, res) {
    if (req.method != "GET"){
        // 'GET' requests have no 'body'
        var { unit, id, achievement_title, achievement_wording, parent_id} = req.body
    }
    if (req.method == 'DELETE'){
        // Block the deletion if the pre-unit achievement has been inserted into an Introduction template
        let primary_appointments = await prisma.Unit.findUnique({
            where: {
                name: unit
            },
            select: {
                PrimaryAppointments: {
                    where: {
                        id: parent_id
                    }
                }
            }
        })
        const primary_appointment_templates = primary_appointments.PrimaryAppointments.map(obj=>[obj.template, obj.transcripttemplate])[0]
        for (let i = 0; i < primary_appointment_templates.length; i++) {
            const inserted_placeholders_wording = [...primary_appointment_templates[i].matchAll(/\{[^}]+\}/g)] // global search 
                                                    .map(obj=>obj[0].slice(1,-1).toLowerCase()) // index 0 corresponds to the actual match detected. The rest is metadata
            if (inserted_placeholders_wording.includes(achievement_title.toLowerCase())){
                return res.status(400).json({ message: `*'${achievement_title}' cannot be deleted as it is used in the below template.*
                                                        
                                                        "${primary_appointment_templates[i]}"

                                                        *If you want to delete '${achievement_title}', you must remove it from the above template first.*
                                                        *(Remember to click 'Save')*`                                                        
                    }
                )                
            }      
        }   
        
    }
    if(req.method == 'POST' || req.method =='PUT'){
        if (!achievement_title){
            return res.status(400).json({ message: 'The title is missing' })
        }
        if (!achievement_wording){
            return res.status(400).json({ message: 'The wording is missing' })
        }     
        // Placeholder Validation
        const valid_placholders = personal_particulars.map(str => str.toLowerCase())
        const inserted_placeholders_wording = [...achievement_wording.matchAll(/\{[^}]+\}/g)] // global search
        for (let i=0; i<inserted_placeholders_wording.length; i++){
            const candidate_data = inserted_placeholders_wording[i]
            const candidate = candidate_data[0].slice(1,-1) // index 0 corresponds to the actual match detected. The rest is metadata
            if (!valid_placholders.includes(candidate.toLowerCase())){
                return res.status(400).json({ message: `{${candidate}} was found in the wording, but '${candidate}' is not a Personal Particular.
                                                        
                                                        *Personal Particulars (case-insensitive):*
                                                        ${personal_particulars.join(", ")}`                                                        
                    }
                )
            }
        }                
    }

    try{
        switch (req.method) {
            case "GET":
                const unit_primary_appointment_achievements_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        PrimaryAppointmentAchievements: {
                            where: {
                                primaryappointmentId: req.query.parent_id
                            }
                        }
                    }
                })
                const unit_primary_appointment_achievements = unit_primary_appointment_achievements_dict.PrimaryAppointmentAchievements
                if (unit_primary_appointment_achievements.length < 1) {
                    var init_list = []
                    /*
                    var init_list = [{
                        id: uuidv4(),
                        parent_id: req.query.parent_id,
                        achievement_title: '',
                        previously_saved_achievement_title: '',
                        achievement_wording: '',
                        previously_saved_achievement_wording: '',        
                        button_state: "save"
                    }]
                    */
                } else {
                    var init_list = unit_primary_appointment_achievements.map((primary_appointment_achievement) => {
                        return {
                            id: primary_appointment_achievement.id,
                            parent_id: req.query.parent_id,
                            achievement_title: primary_appointment_achievement.title,
                            previously_saved_achievement_title: primary_appointment_achievement.title,
                            achievement_wording: primary_appointment_achievement.template,
                            previously_saved_achievement_wording: primary_appointment_achievement.template,
                            button_state: "edit"
                        }
                    })
                }    
                res.status(200).json({init_list, message:"Introdutions Successfully Retrieved"})
                break

            case "POST":              
                // Create a new PrimaryAppointmentAchievement Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        PrimaryAppointmentAchievements: {
                            create: {
                                id: id,
                                title: achievement_title,
                                template: achievement_wording,
                                PrimaryAppointment: {
                                    connect: {id: parent_id}
                                }
                            }
                        }
                    }
                })

                res.status(200).json({ message: 'Save Successful' })
                break
    
            case 'PUT':                 
                // Update the old PrimaryAppointmentAchievement object
                await prisma.PrimaryAppointmentAchievement.update({
                    where: {
                        id: id
                    },
                    data: {
                        title: achievement_title,
                        template: achievement_wording
                    }
                })
                res.status(200).json({ message: 'Save Successful' })
                break
    
            case 'DELETE':
                // Delete the PrimaryAppointmentAchievement object if it exists
                const PrimaryAppointmentAchievement_exists = await prisma.PrimaryAppointmentAchievement.findUnique({
                    where: {
                        id: id
                    }
                })
                if (PrimaryAppointmentAchievement_exists){
                    await prisma.PrimaryAppointmentAchievement.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, PrimaryAppointmentAchievement-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the PrimaryAppointmentAchievement/rank to all of its templates. 
                res.status(200).json({ message: 'Delete Successful' })
                break
                
            default:
                break
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.message})
    }
}
    