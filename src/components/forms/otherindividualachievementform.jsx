import { useState } from "react"
import cloneDeep from 'lodash/cloneDeep';

export const OtherIndividualAchievementForm = ({
    id,
    achievement,
    previously_saved_achievement,
    template,
    previously_saved_template,
    transcript_template,
    previously_saved_transcript_template,    
    related_vocation_ranks,
    previously_saved_related_vocation_ranks,
    available_vocation_ranks,
    other_individual_achievements_list,
    set_other_individual_achievements_list,
    button_state,
    form_index,
    unit,
    set_dialog_settings,
    permanently_disable_edit,
    display
}) => {

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
        const temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)
        temp_other_individual_achievements_list[form_index]['button_state'] = "save"
        set_other_individual_achievements_list(temp_other_individual_achievements_list)
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
        const temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)
        temp_other_individual_achievements_list[form_index]['button_state'] = "edit"
        temp_other_individual_achievements_list[form_index]['template'] = previously_saved_template
        temp_other_individual_achievements_list[form_index]['transcript_template'] = previously_saved_transcript_template        
        temp_other_individual_achievements_list[form_index]['achievement'] = previously_saved_achievement
        temp_other_individual_achievements_list[form_index]['related_vocation_ranks'] = cloneDeep(previously_saved_related_vocation_ranks)
        set_other_individual_achievements_list(temp_other_individual_achievements_list)
        //console.log(temp_other_individual_achievements_list)        
    }


    /*FUNCTIONS THAT UPDATE other_individual_achievements_list WHENEVER ANY (UNSAVED) CHANGES ARE MADE*/

    const onChangeText = (event, form_index) => {

        if (permanently_disable_edit) {
            return
        }

        const temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)
        temp_other_individual_achievements_list[form_index][event.target.name] = event.target.value
        set_other_individual_achievements_list(temp_other_individual_achievements_list)
        console.log(temp_other_individual_achievements_list)
    }

    const onChangeCheckbox = (event, form_index) => {

        if (permanently_disable_edit) {
            return
        }

        const [checkbox_rank, checkbox_vocation] = event.target.name.split("||")
        let temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)

        if (event.target.checked) {        
            temp_other_individual_achievements_list[form_index]['related_vocation_ranks'][checkbox_rank].push(checkbox_vocation)
        } else {
            temp_other_individual_achievements_list[form_index]['related_vocation_ranks'][checkbox_rank] = temp_other_individual_achievements_list[form_index]['related_vocation_ranks'][checkbox_rank]
                .filter(vocation => vocation !== checkbox_vocation)
        }

        set_other_individual_achievements_list(temp_other_individual_achievements_list)
        console.log(temp_other_individual_achievements_list)
    }

    const onAllRank = (event, form_index) => {
        const checkbox_rank = event.target.name
        let temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)

        if (event.target.checked) {
            temp_other_individual_achievements_list[form_index]['related_vocation_ranks'][checkbox_rank] = cloneDeep(available_vocation_ranks[checkbox_rank])
        } else {
            temp_other_individual_achievements_list[form_index]['related_vocation_ranks'][checkbox_rank] = []
        }
        set_other_individual_achievements_list(temp_other_individual_achievements_list)
        console.log(temp_other_individual_achievements_list)
    }


    /*FUNCTIONS WHICH MANAGE TO 'SAVE' OR 'DELETE' BUTTON CLICKS*/

    const onClickSave = async (event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        const achievement_cleaned = achievement.replace(/\s+/g, ' ').trim()
        let template_cleaned = template.replace(/[ \t\r\f\v]+/g, ' ').trim() // Removes all extra spaces except \n
        template_cleaned = template_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted
        let transcript_template_cleaned = transcript_template.replace(/[ \t\r\f\v]+/g, ' ').trim() // Removes all extra spaces except \n
        transcript_template_cleaned = transcript_template_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted        
        //Check if the previously saved text is an empty string
        // If so, it is an update so a 'PUT' method should be used.
        // Otherwise, create a new Introduction object with 'POST'
        const is_update = previously_saved_template != ''
        const http_method = is_update ? "PUT" : "POST"
        createOrEditOtherIndividualAchievement({
            id,
            achievement: achievement_cleaned,
            template: template_cleaned,
            transcript_template: transcript_template_cleaned,            
            related_vocation_ranks,
            other_individual_achievements_list,
            set_other_individual_achievements_list,
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
            deleteOtherIndividualAchievement({
                id,
                other_individual_achievements_list,
                set_other_individual_achievements_list,
                form_index,
                unit
            })
            return
        }

        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to delete '${previously_saved_achievement}'and its following template?*

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
                { color: "#000000", font_size: "16px", text_align: "left", margin_left: "0", margin_right: "auto" }              
            ],
            "displayed": true,
            "onClickDialog": handleDeleteConfirmation,
            "onClickDialogProps": {
                id,
                other_individual_achievements_list,
                set_other_individual_achievements_list,
                form_index,
                unit,
            }
        })
    }


    const handleDeleteConfirmation = ({
        id,
        other_individual_achievements_list,
        set_other_individual_achievements_list,
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
        deleteOtherIndividualAchievement({
            id,
            other_individual_achievements_list,
            set_other_individual_achievements_list,
            form_index,
            unit
        })
    }


    /* HELPER FUNCTIONS THAT DIRECTLY INVOKE API CALLS TO EXECUTE POST/PUT/DELETE REQUESTS */
    const createOrEditOtherIndividualAchievement = async ({
        id,
        achievement,
        template,
        transcript_template,        
        related_vocation_ranks,
        other_individual_achievements_list,
        set_other_individual_achievements_list,
        form_index,
        unit,
        http_method
    }) => {
        try {
            const response = await fetch("/api/otherindividualachievements", {
                method: http_method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                    achievement,
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
                const temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)
                temp_other_individual_achievements_list[form_index]['button_state'] = "edit"
                temp_other_individual_achievements_list[form_index]['previously_saved_achievement'] = achievement
                temp_other_individual_achievements_list[form_index]['achievement'] = achievement // Display the cleaned achievement                  
                temp_other_individual_achievements_list[form_index]['previously_saved_template'] = template
                temp_other_individual_achievements_list[form_index]['template'] = template // Display the cleaned template
                temp_other_individual_achievements_list[form_index]['previously_saved_transcript_template'] = transcript_template
                temp_other_individual_achievements_list[form_index]['transcript_template'] = transcript_template // Display the cleaned transcript_template                              
                temp_other_individual_achievements_list[form_index]['previously_saved_related_vocation_ranks'] = cloneDeep(related_vocation_ranks)
                set_other_individual_achievements_list(temp_other_individual_achievements_list)
                //console.log(temp_other_individual_achievements_list)               
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }


    const deleteOtherIndividualAchievement = async ({
        id,
        other_individual_achievements_list,
        set_other_individual_achievements_list,
        form_index,
        unit,
    }) => {
        try {
            const response = await fetch("/api/otherindividualachievements", {
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
                const temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)
                temp_other_individual_achievements_list.splice(form_index, 1)
                set_other_individual_achievements_list(temp_other_individual_achievements_list)
            } else if (!response.ok) {
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }

        } catch (error) {
            displayErrorMessage(error.message)
        }

    }


    return (
        <div style={{display: display}}>
            <form onSubmit={onClickSave} className="section-module">
            <div className="template-group">
                    <p>Achievement:</p>
                    <input onChange={(event) => { onChangeText(event, form_index) }} className="title-input" name='achievement' placeholder="e.g. BSOM" value={achievement} disabled={edit_disabled}></input>
                </div> 
                <div className="applies-to-vrc">
                    <p>This achievement applies to:</p>
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
                    <textarea onChange={(event) => { onChangeText(event, form_index) }} className="transcript-template-input" name="transcript_template" placeholder="e.g. To be added when I get back to office." value={transcript_template} disabled={edit_disabled}></textarea>
                </div>                                            
                <div className="template-group">
                    <p>Testimonial Template:</p>
                    <textarea onChange={(event) => { onChangeText(event, form_index) }} className="template-input" name='template' placeholder="e.g. To be added when I get back to office." value={template} disabled={edit_disabled}></textarea>
                </div>
                <div className="save-edit-delete-group">
                    <button type="submit" className={save_button_class}>Save</button>
                    <button onClick={onEdit} className={edit_button_class}>Edit</button>
                    <button onClick={onCancelChanges} className={cancel_button_class}>Cancel</button>
                    <button onClick={(event) => { onClickDelete(event, form_index) }} className={delete_button_class}>Delete</button>
                </div>                      
            </form>
        </div>
    )
}