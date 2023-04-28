import { useState } from "react"
import cloneDeep from 'lodash/cloneDeep';

export const ConclusionForm = ({
    id,
    template,
    previously_saved_template,
    transcript_template,
    previously_saved_transcript_template,    
    related_vocation_ranks,
    previously_saved_related_vocation_ranks,
    available_vocation_ranks,
    vocation_ranks_with_templates,
    conclusions_list,
    set_conclusions_list,
    button_state,
    index,
    unit,
    set_dialog_settings,
    permanently_disable_edit,
    display
}) => {
    /*COMPARE related_vocation_ranks AGAINST available_vocation_ranks TO DECIDE WHICH CHECKBOXES TO CHECK*/
    // This is important because Vocation-Rank-Combination objects and their connections are retained even if
    // their corresponding Vocation object is deleted. 
    // Therefore, we need to filter out these conclusions
    const available_related_vocation_ranks_list = Object.keys(available_vocation_ranks).map((vocation) => {
        return [vocation, available_vocation_ranks[vocation].filter((rank) => related_vocation_ranks[vocation]?.includes(rank))]
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
        if (error_num_lines == 1) {
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
        const temp_conclusions_list = cloneDeep(conclusions_list)
        temp_conclusions_list[index]['button_state'] = "save"
        set_conclusions_list(temp_conclusions_list)
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
        const temp_conclusions_list = cloneDeep(conclusions_list)
        temp_conclusions_list[index]['button_state'] = "edit"
        temp_conclusions_list[index]['template'] = previously_saved_template
        temp_conclusions_list[index]['transcript_template'] = previously_saved_transcript_template        
        temp_conclusions_list[index]['related_vocation_ranks'] = cloneDeep(previously_saved_related_vocation_ranks)
        set_conclusions_list(temp_conclusions_list)
        //console.log(temp_conclusions_list)
    }


    /*FUNCTIONS THAT UPDATE conclusions_list WHENEVER ANY (UNSAVED) CHANGES ARE MADE*/

    const onChangeText = (event, index) => {

        if (permanently_disable_edit) {
            return
        }

        const temp_conclusions_list = cloneDeep(conclusions_list)
        temp_conclusions_list[index][event.target.name] = event.target.value
        set_conclusions_list(temp_conclusions_list)
        //console.log(temp_conclusions_list)
    }

    const onChangeCheckbox = (event, index) => {

        if (permanently_disable_edit) {
            return
        }

        const [checkbox_vocation, checkbox_rank] = event.target.name.split("||")
        let temp_conclusions_list = cloneDeep(conclusions_list)

        if (event.target.checked) {
            // If the vocation-rank has already been assigned to another template, block the change in checkbox and alert the user about the issue
            const already_assigned_elsewhere = vocation_ranks_with_templates[checkbox_vocation]?.includes(checkbox_rank)
            if (already_assigned_elsewhere) {
                const error_message = `*'${checkbox_vocation} ${checkbox_rank}' has already been assigned to another Introdution template.*
                                        You must unassign '${checkbox_vocation} ${checkbox_rank}' from the other Introduction Template before you can assign it to this one.
                                        *(Remember to click 'Save' after unassigning it)*`
                displayErrorMessage(error_message)
                return
            }
            // Otherwise, update the conclusions_list to reflect the change in checkbox
            if (!temp_conclusions_list[index]['related_vocation_ranks'][checkbox_vocation]){
                temp_conclusions_list[index]['related_vocation_ranks'][checkbox_vocation] = [checkbox_rank]
            } else {
                temp_conclusions_list[index]['related_vocation_ranks'][checkbox_vocation].push(checkbox_rank)
            }
        } else {
            temp_conclusions_list[index]['related_vocation_ranks'][checkbox_vocation] = temp_conclusions_list[index]['related_vocation_ranks'][checkbox_vocation]
                .filter(rank => rank !== checkbox_rank)
        }

        set_conclusions_list(temp_conclusions_list)
        console.log(temp_conclusions_list)
    }


    /*FUNCTIONS WHICH MANAGE TO 'SAVE' OR 'DELETE' BUTTON CLICKS*/

    const onClickSave = async (event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        let template_cleaned = template.replace(/[ \t\r\f\v]+/g, ' ').trim() // Removes all extra spaces except \n
        template_cleaned = template_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted
        let transcript_template_cleaned = transcript_template.replace(/[ \t\r\f\v]+/g, ' ').trim() // Removes all extra spaces except \n
        transcript_template_cleaned = transcript_template_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted        
        //Check if the previously saved text is an empty string
        // If so, it is an update so a 'PUT' method should be used.
        // Otherwise, create a new Conclusion object with 'POST'
        const is_update = previously_saved_template != ''
        const http_method = is_update ? "PUT" : "POST"
        createOrEditConclusion({
            id,
            template: template_cleaned,
            transcript_template: transcript_template_cleaned,            
            related_vocation_ranks,
            conclusions_list,
            set_conclusions_list,
            index,
            unit,
            http_method
        })
    }

    const onClickDelete = async (event, index) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        // If the template has not been saved previously, deleting the form will not alter anything in the database.
        // As such, call the delete function right away
        if (previously_saved_template == '') {
            deleteConclusion({
                id,
                conclusions_list,
                set_conclusions_list,
                index,
                unit
            })
            return
        }

        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to delete following Conclusion template?*

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
                conclusions_list,
                set_conclusions_list,
                index,
                unit
            }
        })
    }


    const handleDeleteConfirmation = ({
        id,
        conclusions_list,
        set_conclusions_list,
        index,
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
        deleteConclusion({
            id,
            conclusions_list,
            set_conclusions_list,
            index,
            unit
        })
    }


    /* HELPER FUNCTIONS THAT DIRECTLY INVOKE API CALLS TO EXECUTE POST/PUT/DELETE REQUESTS */
    const createOrEditConclusion = async ({
        id,
        template,
        transcript_template,        
        related_vocation_ranks,
        conclusions_list,
        set_conclusions_list,
        index,
        unit,
        http_method
    }) => {
        try {
            const response = await fetch("/api/conclusions", {
                method: http_method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
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
                const temp_conclusions_list = cloneDeep(conclusions_list)
                temp_conclusions_list[index]['button_state'] = "edit"
                temp_conclusions_list[index]['previously_saved_template'] = template
                temp_conclusions_list[index]['template'] = template // Display the cleaned template
                temp_conclusions_list[index]['previously_saved_transcript_template'] = transcript_template
                temp_conclusions_list[index]['transcript_template'] = transcript_template // Display the cleaned transcript_template                
                temp_conclusions_list[index]['previously_saved_related_vocation_ranks'] = cloneDeep(related_vocation_ranks)
                set_conclusions_list(temp_conclusions_list)
                console.log(temp_conclusions_list)
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }


    const deleteConclusion = async ({
        id,
        conclusions_list,
        set_conclusions_list,
        index,
        unit,
    }) => {
        try {
            const response = await fetch("/api/conclusions", {
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
                const temp_conclusions_list = cloneDeep(conclusions_list)
                temp_conclusions_list.splice(index, 1)
                set_conclusions_list(temp_conclusions_list)
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

                <div className="applies-to-vrc">
                    <p>This conclusion applies to:</p>
                    {Object.entries(available_vocation_ranks).length == 0 &&
                        <div className="applies-to-no-vocation-ranks">
                            You have not added any relevant vocations & ranks yet!
                        </div>
                    }
                    <div className="applies-to-vocation-ranks-group">
                        {Object.keys(available_vocation_ranks).map((vocation, i_outer) => {
                            return (
                                <div key={i_outer} className="each-vocation-group">
                                    <div className="vocation-rank-option-group">
                                        <label style={{fontWeight: "bold"}}>{vocation}</label>
                                    </div>
                                    <ul>
                                        {available_vocation_ranks[vocation].map((rank, i_inner) => {
                                            // If the rank is an empty string, i.e. is not selected, skip it
                                            if (!rank) {
                                                return
                                            }
                                            return (
                                                <li key={i_inner} className="vocation-rank-li">
                                                    <input
                                                        onChange={(event) => { onChangeCheckbox(event, index) }}
                                                        style={{transform: "scale(1.3)", marginRight: "10px"}}
                                                        type="checkbox"
                                                        name={`${vocation}||${rank}`}
                                                        checked={available_related_vocation_ranks[vocation].includes(rank)}
                                                        disabled={edit_disabled}></input>
                                                    <label>{rank}</label>
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
                    <textarea onChange={(event) => { onChangeText(event, index) }} className="transcript-template-input" name="transcript_template" placeholder="In summary, {rank} {surname} was a valued member of the Battalion and we thank him for his contributions" value={transcript_template} disabled={edit_disabled}></textarea>
                </div>                      
                <div className="template-group">
                    <p>Testimonial Template:</p>
                    <textarea onChange={(event) => { onChangeText(event, index) }} className="template-input" name="template" placeholder="In summary, {rank} {surname} served with pride and purpose. Throughout his tenure in {coy} Company, he adopted a positive attitude and was able to gain the respect of both superiors and peers. We are confident that {rank} {surname} will be a valuable asset to his future employers. We thank him for his contributions to National Service and wish him the very best for his future endeavours." value={template} disabled={edit_disabled}></textarea>
                </div>
                <div className="save-edit-delete-group">
                    <button type="submit" className={save_button_class}>Save</button>
                    <button onClick={onEdit} className={edit_button_class}>Edit</button>
                    <button onClick={onCancelChanges} className={cancel_button_class}>Cancel</button>
                    <button onClick={(event) => { onClickDelete(event, index) }} className={delete_button_class}>Delete</button>
                </div>
            </form>
        </div>
    )
}