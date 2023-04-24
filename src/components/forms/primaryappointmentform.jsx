import { useEffect, useState } from "react"
import { PrimaryAppointmentAchievementForm } from "./primaryappointmentachievementform";
import { v4 as uuidv4 } from "uuid"
import cloneDeep from 'lodash/cloneDeep';

export const PrimaryAppointmentForm = ({
    id,
    appointment,
    previously_saved_appointment,
    template,
    previously_saved_template,
    transcript_template,
    previously_saved_transcript_template,    
    related_vocation_ranks,
    previously_saved_related_vocation_ranks,
    available_vocation_ranks,
    primary_appointments_list,
    set_primary_appointments_list,
    button_state,
    form_index,
    unit,
    set_dialog_settings,
    permanently_disable_edit,
    display
}) => {

    const [related_achievements_list, set_related_achievements_list] = useState([])

    // Make an API call to obtain the section information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const related_achievements_response = await fetch(`/api/primaryappointmentachievements?unit=${unit}&parent_id=${id}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const related_achievements_response_data = await related_achievements_response.json()
            set_related_achievements_list(related_achievements_response_data.init_list)
        }
        fetchSectionData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    /*COMPARE related_vocation_ranks AGAINST available_vocation_ranks TO DECIDE WHICH CHECKBOXES TO CHECK*/
    // This is important because Vocation-Rank-Combination objects and their connections are retained even if
    // their corresponding Vocation object is deleted. 
    // Therefore, we need to filter out these vocations
    const available_related_vocation_ranks_list = Object.keys(available_vocation_ranks).map((rank_type) => {
        return [rank_type, available_vocation_ranks[rank_type].filter((vocation) => related_vocation_ranks[rank_type]?.includes(vocation))]
    })
    const available_related_vocation_ranks = Object.fromEntries(available_related_vocation_ranks_list)


    /*INITIALISING OF DISPLAY*/
    if (button_state === "edit") {
        var init_save_button_class = "save-changes-button-hidden"
        var init_cancel_button_class = "cancel-button-hidden"
        var init_edit_button_class = "edit-button-visible"
        var init_delete_button_class = "delete-button-visible"
        var init_edit_disabled = true
    } else if (button_state === "save") {
        var init_save_button_class = "save-changes-button-visible"
        var init_cancel_button_class = "cancel-button-visible"
        var init_edit_button_class = "edit-button-hidden"
        var init_delete_button_class = "delete-button-hidden"
        var init_edit_disabled = false
    }
    const [save_button_class, set_save_button_class] = useState(init_save_button_class)
    const [cancel_button_class, set_cancel_button_class] = useState(init_cancel_button_class)
    const [edit_button_class, set_edit_button_class] = useState(init_edit_button_class)
    const [delete_button_class, set_delete_button_class] = useState(init_delete_button_class)
    const [edit_disabled, set_edit_disabled] = useState(init_edit_disabled)


    /*DEFINING COMMONLY USED DIALOG FUNCTIONS*/
    const closeDialogueBox = () => {
        set_dialog_settings({
            "message": '',
            "buttons": [],
            "line_props": [],
            "displayed": false,
            "onClickDialog": function () { return },
            "onClickDialogProps": {}
        })
    }

    const displayErrorMessage = async (error_message) => {

        // This is necessary as the number of lines error messages consist of varies
        const error_num_lines = error_message.split('\n').length

        // If the error message consists of more than 1 line, align the text to the left instead
        if (error_num_lines == 0) {
            var error_lines_props = Array(error_num_lines).fill({
                color: "#000000", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "auto"
            })
        } else {
            var error_lines_props = Array(error_num_lines).fill({
                color: "#000000", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0"
            })
        }

        set_dialog_settings({
            "message":
                `*Error*
                ${error_message}`,
            "buttons": [
                { text: "Close", action: "exit", background: "#01a4d9", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#E60023", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                ...error_lines_props],
            "displayed": true,
            "onClickDialog": closeDialogueBox,
            "onClickDialogProps": { set_dialog_settings }
        })
    }


    /*FUNCTIONS THAT CHANGE THE DISPLAY WHEN 'EDIT' and 'CANCEL' ARE CLICKED*/

    const onEdit = (event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        set_save_button_class("save-changes-button-visible")
        set_cancel_button_class("cancel-button-visible")
        set_edit_button_class("edit-button-hidden")
        set_delete_button_class("delete-button-hidden")
        set_edit_disabled(false)
        const temp_primary_appointments_list = cloneDeep(primary_appointments_list)
        temp_primary_appointments_list[form_index]['button_state'] = "save"
        set_primary_appointments_list(temp_primary_appointments_list)
    }

    const onCancelChanges = (event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        set_save_button_class("save-changes-button-hidden")
        set_cancel_button_class("cancel-button-hidden")
        set_edit_button_class("edit-button-visible")
        set_delete_button_class("delete-button-visible")
        set_edit_disabled(true)
        const temp_primary_appointments_list = cloneDeep(primary_appointments_list)
        temp_primary_appointments_list[form_index]['button_state'] = "edit"
        temp_primary_appointments_list[form_index]['template'] = previously_saved_template
        temp_primary_appointments_list[form_index]['transcript_template'] = previously_saved_transcript_template
        temp_primary_appointments_list[form_index]['appointment'] = previously_saved_appointment
        temp_primary_appointments_list[form_index]['related_vocation_ranks'] = cloneDeep(previously_saved_related_vocation_ranks)
        set_primary_appointments_list(temp_primary_appointments_list)
        //console.log(temp_primary_appointments_list)        
    }


    /*FUNCTIONS THAT UPDATE primary_appointments_list WHENEVER ANY (UNSAVED) CHANGES ARE MADE*/

    const onChangeText = (event, form_index) => {

        if (permanently_disable_edit) {
            return
        }

        const temp_primary_appointments_list = cloneDeep(primary_appointments_list)
        temp_primary_appointments_list[form_index][event.target.name] = event.target.value
        set_primary_appointments_list(temp_primary_appointments_list)
        console.log(temp_primary_appointments_list)
    }

    const onChangeCheckbox = (event, form_index) => {

        if (permanently_disable_edit) {
            return
        }

        const [checkbox_rank, checkbox_vocation] = event.target.name.split("||")
        let temp_primary_appointments_list = cloneDeep(primary_appointments_list)

        if (event.target.checked) {
            temp_primary_appointments_list[form_index]['related_vocation_ranks'][checkbox_rank].push(checkbox_vocation)
        } else {
            temp_primary_appointments_list[form_index]['related_vocation_ranks'][checkbox_rank] = temp_primary_appointments_list[form_index]['related_vocation_ranks'][checkbox_rank]
                .filter(vocation => vocation !== checkbox_vocation)
        }

        set_primary_appointments_list(temp_primary_appointments_list)
        console.log(temp_primary_appointments_list)
    }

    const onAllRank = (event, form_index) => {
        const checkbox_rank = event.target.name
        let temp_primary_appointments_list = cloneDeep(primary_appointments_list)

        if (event.target.checked) {
            temp_primary_appointments_list[form_index]['related_vocation_ranks'][checkbox_rank] = cloneDeep(available_vocation_ranks[checkbox_rank])
        } else {
            temp_primary_appointments_list[form_index]['related_vocation_ranks'][checkbox_rank] = []
        }
        set_primary_appointments_list(temp_primary_appointments_list)
        console.log(temp_primary_appointments_list)
    }


    /*FUNCTIONS WHICH MANAGE TO 'SAVE' OR 'DELETE' BUTTON CLICKS*/

    const onClickSave = async (event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        const appointment_cleaned = appointment.replace(/\s+/g, ' ').trim()
        let template_cleaned = template.replace(/[ \t\r\f\v]+/g, ' ').trim() // Removes all extra spaces except \n
        template_cleaned = template_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted
        let transcript_template_cleaned = transcript_template.replace(/[ \t\r\f\v]+/g, ' ').trim() // Removes all extra spaces except \n
        transcript_template_cleaned = transcript_template_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted        
        //Check if the previously saved text is an empty string
        // If so, it is an update so a 'PUT' method should be used.
        // Otherwise, create a new Introduction object with 'POST'
        const is_update = previously_saved_template != ''
        const http_method = is_update ? "PUT" : "POST"
        createOrEditPrimaryAppointment({
            id,
            appointment: appointment_cleaned,
            template: template_cleaned,
            transcript_template: transcript_template_cleaned,
            related_vocation_ranks,
            primary_appointments_list,
            set_primary_appointments_list,
            form_index,
            unit,
            http_method
        })
    }

    const onClickDelete = async (event, form_index) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }


        // If the template has not been saved previously, deleting the form will not alter anything in the database.
        // As such, call the delete function right away
        if (previously_saved_template == '') {
            deletePrimaryAppointment({
                id,
                primary_appointments_list,
                set_primary_appointments_list,
                form_index,
                unit
            })
            return
        }

        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to delete '${previously_saved_appointment}' and its following template?*

                *Transcript:*
                "${previously_saved_transcript_template}"
            
                *Testimonial:*
                "${previously_saved_template}"

                 *This deletion cannot be reversed, so you should store this template somewhere on your computer so that way you can restore it in the future if need be.*`,
            "buttons": [
                { text: "Delete", action: "delete", background: "#E60023", color: "#FFFFFF" },
                { text: "Cancel", action: "cancel", background: "#00ac13", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                { color: "#000000", font_size: "16px", text_align: "left", margin_left: "0", margin_right: "auto" },                
            ],
            "displayed": true,
            "onClickDialog": handleDeleteConfirmation,
            "onClickDialogProps": {
                id,
                primary_appointments_list,
                set_primary_appointments_list,
                form_index,
                unit,
            }
        })
    }


    const handleDeleteConfirmation = ({
        id,
        primary_appointments_list,
        set_primary_appointments_list,
        form_index,
        unit,
        action
    }) => {
        // Close the dialog no matter what
        set_dialog_settings({
            "message": '',
            "buttons": [],
            "line_props": [],
            "displayed": false,
            "onClickDialog": function () { return },
            "onClickDialogProps": {}
        })
        // Break out of the function if the delete operation is cancelled
        if (action == "cancel" || action == "exit") {
            return
        }
        // Otherwise execute the delete operation
        deletePrimaryAppointment({
            id,
            primary_appointments_list,
            set_primary_appointments_list,
            form_index,
            unit
        })
    }


    /* HELPER FUNCTIONS THAT DIRECTLY INVOKE API CALLS TO EXECUTE POST/PUT/DELETE REQUESTS */
    const createOrEditPrimaryAppointment = async ({
        id,
        appointment,
        template,
        transcript_template,        
        related_vocation_ranks,
        primary_appointments_list,
        set_primary_appointments_list,
        form_index,
        unit,
        http_method
    }) => {
        try {
            const response = await fetch("/api/primaryappointments", {
                method: http_method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                    appointment,
                    template,
                    transcript_template,                    
                    related_vocation_ranks
                })
            })
            // Only change the button displays when the data has been successfully saved
            if (response.status == 200) {
                set_save_button_class("save-changes-button-hidden")
                set_cancel_button_class("cancel-button-hidden")
                set_edit_button_class("edit-button-visible")
                set_delete_button_class("delete-button-visible")
                set_edit_disabled(true)
                const temp_primary_appointments_list = cloneDeep(primary_appointments_list)
                temp_primary_appointments_list[form_index]['button_state'] = "edit"
                temp_primary_appointments_list[form_index]['previously_saved_appointment'] = appointment
                temp_primary_appointments_list[form_index]['appointment'] = appointment // Display the cleaned appointment                  
                temp_primary_appointments_list[form_index]['previously_saved_template'] = template
                temp_primary_appointments_list[form_index]['template'] = template // Display the cleaned template 
                temp_primary_appointments_list[form_index]['previously_saved_transcript_template'] = transcript_template
                temp_primary_appointments_list[form_index]['transcript_template'] = transcript_template // Display the cleaned transcript_template                              
                temp_primary_appointments_list[form_index]['previously_saved_related_vocation_ranks'] = cloneDeep(related_vocation_ranks)
                set_primary_appointments_list(temp_primary_appointments_list)
                //console.log(temp_primary_appointments_list)               
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }


    const deletePrimaryAppointment = async ({
        id,
        primary_appointments_list,
        set_primary_appointments_list,
        form_index,
        unit,
    }) => {
        try {
            const response = await fetch("/api/primaryappointments", {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id
                })
            })
            if (response.status == 200) {
                const temp_primary_appointments_list = cloneDeep(primary_appointments_list)
                temp_primary_appointments_list.splice(form_index, 1)
                set_primary_appointments_list(temp_primary_appointments_list)
            } else if (!response.ok) {
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }

        } catch (error) {
            displayErrorMessage(error.message)
        }

    }

    const onAddRelatedAchievementForm = (event) => {
        event.preventDefault()
        set_related_achievements_list([...cloneDeep(related_achievements_list), {
            id: uuidv4(),
            parent_id: id,
            achievement_title: '',
            previously_saved_achievement_title: '',
            achievement_wording: '',
            previously_saved_achievement_wording: '',
            button_state: "save"
        }])
    }


    return (
        <div style={{display: display}}>
            <form onSubmit={onClickSave} className="section-module">
                <div className="template-group">
                    <p>Primary Appointment:</p>
                    <input onChange={(event) => { onChangeText(event, form_index) }} className="title-input" name='appointment' placeholder="e.g. Platoon Commander" value={appointment} disabled={edit_disabled}></input>
                </div>
                <div className="applies-to-vrc">
                    <p>This appointment applies to:</p>
                    {Object.entries(available_vocation_ranks).length == 0 &&
                        <div className="applies-to-no-vocation-ranks">
                            You have not added any relevant vocations & ranks yet!
                        </div>
                    }
                    <div className="applies-to-vocation-ranks-group">
                        {Object.keys(available_vocation_ranks).map((rank, i_outer) => {
                            return (
                                <div key={i_outer} className="each-rank-group">
                                    <div className="vocation-rank-option-group">
                                        <input
                                            onChange={(event) => { onAllRank(event, form_index) }}
                                            type="checkbox"
                                            name={rank}
                                            checked={available_related_vocation_ranks[rank].length == available_vocation_ranks[rank].length}
                                            disabled={edit_disabled}></input>
                                        <label>All {rank}s</label>
                                    </div>
                                    <ul>
                                        {available_vocation_ranks[rank].map((vocation, i_inner) => {
                                            // If the vocation is an empty string, i.e. is not selected, skip it
                                            if (!vocation) {
                                                return
                                            }
                                            return (
                                                <li key={i_inner} className="vocation-rank-li">
                                                    <input
                                                        onChange={(event) => { onChangeCheckbox(event, form_index) }}
                                                        type="checkbox"
                                                        name={`${rank}||${vocation}`}
                                                        checked={available_related_vocation_ranks[rank].includes(vocation)}
                                                        disabled={edit_disabled}></input>
                                                    <label>{vocation}</label>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="template-group">
                    <p>Transcript Template:</p>
                    <textarea onChange={(event) => { onChangeText(event, form_index) }} className="transcript-template-input" name="transcript_template" placeholder="e.g. {Rank} {Full Name} served as a {Primary Appointment} in {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE)." value={transcript_template} disabled={edit_disabled}></textarea>
                </div>                      
                <div className="template-group">
                    <p>Testimonial Template:</p>
                    <textarea onChange={(event) => { onChangeText(event, form_index) }} className="template-input" name='template' placeholder="e.g. In his primary role, {Rank} {Surname} was responsible for his platoon's training, morale and discipline. In this role, {Rank} {Surname} demonstrated strong leadership and performed well. Notably, <Insert a Trait of a Good Leader> . For instance, <Insert a specific incident that demonstrated this trait>" value={template} disabled={edit_disabled}></textarea>
                </div>
                <div className="save-edit-delete-group">
                    <button type="submit" className={save_button_class}>Save</button>
                    <button onClick={onEdit} className={edit_button_class}>Edit</button>
                    <button onClick={onCancelChanges} className={cancel_button_class}>Cancel</button>
                    <button onClick={(event) => { onClickDelete(event, form_index) }} className={delete_button_class}>Delete</button>
                </div>
                <div className="template-group">
                    <p>Related Achievements (Optional):</p>
                    <div className="achievements-group">
                        {related_achievements_list.map((achievement, form_index) => {
                            return (<PrimaryAppointmentAchievementForm
                                key={achievement.id}
                                id={achievement.id}
                                achievement_title={achievement.achievement_title}
                                previously_saved_achievement_title={achievement.previously_saved_achievement_title}
                                achievement_wording={achievement.achievement_wording}
                                previously_saved_achievement_wording={achievement.previously_saved_achievement_wording}
                                parent_id={achievement.parent_id}
                                related_achievements_list={related_achievements_list}
                                set_related_achievements_list={set_related_achievements_list}
                                button_state={achievement.button_state}
                                form_index={form_index}
                                unit={unit}
                                set_dialog_settings={set_dialog_settings}
                                permanently_disable_edit={false}
                            />)
                        })}
                    </div>
                </div>
                <button onClick={onAddRelatedAchievementForm} className="add-form-button-left">Add Related Achievement</button>
            </form>
        </div>
    )
}