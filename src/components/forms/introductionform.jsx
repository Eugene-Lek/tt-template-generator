import { useState, useRef } from "react"
import cloneDeep from 'lodash/cloneDeep';

export const IntroductionForm = ({
    id,
    template,
    previously_saved_template,
    transcript_template,
    previously_saved_transcript_template,
    related_vocation_ranks,
    previously_saved_related_vocation_ranks,
    available_vocation_ranks,
    vocation_ranks_with_templates,
    introductions_list,
    set_introductions_list,
    button_state,
    intro_index,
    unit,
    set_dialog_settings,
    permanently_disable_edit,
    display,
    savedPersonalParticularsFields
}) => {
    /*COMPARE related_vocation_ranks AGAINST available_vocation_ranks TO DECIDE WHICH CHECKBOXES TO CHECK*/
    // This is important because Vocation-Rank-Combination objects and their connections are retained even if
    // their corresponding Vocation object is deleted. 
    // Therefore, we need to filter out these introductions
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
    const [save_status, set_save_status] = useState()
    const [delete_status, set_delete_status] = useState()    
    const cancelling = useRef(false)


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
        const temp_introductions_list = cloneDeep(introductions_list)
        temp_introductions_list[intro_index]['button_state'] = "save"
        set_introductions_list(temp_introductions_list)
    }

    const onCancelChanges = async(event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        // If the cancel button is clicked while the form is in the process of being saved, 
        // overwrite the ongoing save with the original data
        if (save_status == "pending") {
            set_save_status("cancelling")
            cancelling.current = true
            await createOrEditIntroduction({
                id,
                template: previously_saved_template,
                transcript_template: previously_saved_transcript_template,            
                related_vocation_ranks: previously_saved_related_vocation_ranks,
                introductions_list,
                set_introductions_list,
                intro_index,
                unit,
                http_method: "PUT"
            })        
            set_save_status("resolved")       
            cancelling.current = false 
            // In this case, do not return to the previously saved state so that the user can make an edit based
            // on the latest changes.                    
        } else {
            // If the cancel button is clicked, return to the previously saved state
            set_save_button_class("save-changes-button-hidden")
            set_cancel_button_class("cancel-button-hidden")
            set_edit_button_class("edit-button-visible")
            set_delete_button_class("delete-button-visible")
            set_edit_disabled(true)
            const temp_introductions_list = cloneDeep(introductions_list)
            temp_introductions_list[intro_index]['button_state'] = "edit"
            temp_introductions_list[intro_index]['template'] = previously_saved_template
            temp_introductions_list[intro_index]['transcript_template'] = previously_saved_transcript_template
            temp_introductions_list[intro_index]['related_vocation_ranks'] = cloneDeep(previously_saved_related_vocation_ranks)
            set_introductions_list(temp_introductions_list)
            //console.log(temp_introductions_list)
        }
    }


    /*FUNCTIONS THAT UPDATE introductions_list WHENEVER ANY (UNSAVED) CHANGES ARE MADE*/

    const onChangeText = (event, intro_index) => {

        if (permanently_disable_edit) {
            return
        }

        const temp_introductions_list = cloneDeep(introductions_list)
        temp_introductions_list[intro_index][event.target.name] = event.target.value
        set_introductions_list(temp_introductions_list)
        //console.log(temp_introductions_list)
    }

    const onChangeCheckbox = (event, intro_index) => {

        if (permanently_disable_edit) {
            return
        }

        const [checkbox_vocation, checkbox_rank] = event.target.name.split("||")
        let temp_introductions_list = cloneDeep(introductions_list)

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
            // Otherwise, update the introductions_list to reflect the change in checkbox
            if (!temp_introductions_list[intro_index]['related_vocation_ranks'][checkbox_vocation]){
                temp_introductions_list[intro_index]['related_vocation_ranks'][checkbox_vocation] = [checkbox_rank]
            } else {
                temp_introductions_list[intro_index]['related_vocation_ranks'][checkbox_vocation].push(checkbox_rank)
            }
        } else {
            temp_introductions_list[intro_index]['related_vocation_ranks'][checkbox_vocation] = temp_introductions_list[intro_index]['related_vocation_ranks'][checkbox_vocation]
                .filter(rank => rank !== checkbox_rank)
        }

        set_introductions_list(temp_introductions_list)
        console.log(temp_introductions_list)
    }

    /*FUNCTIONS WHICH MANAGE TO 'SAVE' OR 'DELETE' BUTTON CLICKS*/

    const onClickSave = async (event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }
        
        set_save_status("pending")
        // Removes all extra spaces except \n and removes all fullstops
        let template_cleaned = template.replace(/[ \t\r\f\v]+/g, ' ').replace(/[ \.]+\./g, '.').trim() 
        template_cleaned = template_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted
        // Removes all extra spaces except \n and removes all fullstops
        let transcript_template_cleaned = transcript_template.replace(/[ \t\r\f\v]+/g, ' ').replace(/[ \.]+\./g, '.').trim() 
        transcript_template_cleaned = transcript_template_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted        
        //Check if the previously saved text is an empty string
        // If so, it is an update so a 'PUT' method should be used.
        // Otherwise, create a new Introduction object with 'POST'
        const is_update = previously_saved_template != ''
        const http_method = is_update ? "PUT" : "POST"
        createOrEditIntroduction({
            id,
            template: template_cleaned,
            transcript_template: transcript_template_cleaned,
            related_vocation_ranks,
            introductions_list,
            set_introductions_list,
            intro_index,
            unit,
            http_method
        })
    }

    const onClickDelete = async (event, intro_index) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }


        // If the template has not been saved previously, deleting the form will not alter anything in the database.
        // As such, call the delete function right away
        if (previously_saved_template == '') {
            set_delete_status("pending")
            deleteIntroduction({
                id,
                introductions_list,
                set_introductions_list,
                intro_index,
                unit
            })
            return
        }

        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to delete following Introduction template?*

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
                introductions_list,
                set_introductions_list,
                intro_index,
                unit
            }
        })
    }


    const handleDeleteConfirmation = ({
        id,
        introductions_list,
        set_introductions_list,
        intro_index,
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
        set_delete_status("pending")
        deleteIntroduction({
            id,
            introductions_list,
            set_introductions_list,
            intro_index,
            unit
        })
    }


    /* HELPER FUNCTIONS THAT DIRECTLY INVOKE API CALLS TO EXECUTE POST/PUT/DELETE REQUESTS */
    const personal_particulars = savedPersonalParticularsFields ? savedPersonalParticularsFields.map(fieldSet => fieldSet.name.toLowerCase()) : []
    const createOrEditIntroduction = async ({
        id,
        template,
        transcript_template,
        related_vocation_ranks,
        introductions_list,
        set_introductions_list,
        intro_index,
        unit,
        http_method
    }) => {
        try {
            const response = await fetch("/api/introductions", {
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
            if (response.status == 200 && !cancelling.current) {
                set_save_button_class("save-changes-button-hidden")
                set_cancel_button_class("cancel-button-hidden")
                set_edit_button_class("edit-button-visible")
                set_delete_button_class("delete-button-visible")
                set_edit_disabled(true)
                const temp_introductions_list = cloneDeep(introductions_list)
                temp_introductions_list[intro_index]['button_state'] = "edit"
                temp_introductions_list[intro_index]['previously_saved_template'] = template
                temp_introductions_list[intro_index]['template'] = template // Display the cleaned template
                temp_introductions_list[intro_index]['previously_saved_transcript_template'] = transcript_template
                temp_introductions_list[intro_index]['transcript_template'] = transcript_template // Display the cleaned transcript_template                
                temp_introductions_list[intro_index]['previously_saved_related_vocation_ranks'] = cloneDeep(related_vocation_ranks)
                const inserted_placeholders_transcript = [...transcript_template.matchAll(/\{[^}]+\}/g)].map(obj=> obj[0].slice(1,-1).toLowerCase()) //slice to remove the braces
                const inserted_placeholders_testimonial = [...template.matchAll(/\{[^}]+\}/g)].map(obj=> obj[0].slice(1,-1).toLowerCase()) //slice to remove the braces
                const inserted_pre_unit_achievements = [... new Set([...inserted_placeholders_transcript, ...inserted_placeholders_testimonial])]
                                                        .filter(placeholder=>!personal_particulars.includes(placeholder))                 
                temp_introductions_list[intro_index]['previously_saved_pre_unit_achievements'] = inserted_pre_unit_achievements
                set_introductions_list(temp_introductions_list)
                console.log(temp_introductions_list)
            } else if (!response.ok && !cancelling.current) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            if (!cancelling.current){
                // If the saving process isn't cancelled, display the error message associated with the saving process if any. 
                if (error.message == "Failed to fetch") {
                    displayErrorMessage("You are not connected to the internet")
                } else {
                    displayErrorMessage(error.message)
                }
            }
        }
        set_save_status("resolved")
    }


    const deleteIntroduction = async ({
        id,
        introductions_list,
        set_introductions_list,
        intro_index,
        unit,
    }) => {
        try {
            const response = await fetch("/api/introductions", {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                })
            })
            if (response.status == 200) {
                const temp_introductions_list = cloneDeep(introductions_list)
                temp_introductions_list.splice(intro_index, 1)
                set_introductions_list(temp_introductions_list)
            } else if (!response.ok) {
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }

        } catch (error) {
            if (error.message == "Failed to fetch"){
                displayErrorMessage("You are not connected to the internet")
            } else {
                displayErrorMessage(error.message)
            }
        }
        set_delete_status("resolved")
    }

    return (
        <div style={{ display: display }}>
            <form onSubmit={onClickSave} className="section-module">

                <div className="applies-to-vrc">
                    <p>This introduction applies to:</p>
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
                                                        onChange={(event) => { onChangeCheckbox(event, intro_index) }}
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
                    <textarea onChange={(event) => { onChangeText(event, intro_index) }} className="transcript-template-input" name="transcript_template" placeholder="e.g. {Rank} {Full Name} served as a {Primary Appointment} in {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE)." value={transcript_template} disabled={edit_disabled}></textarea>
                </div>
                <div className="template-group">
                    <p>Testimonial Template:</p>
                    <textarea onChange={(event) => { onChangeText(event, intro_index) }} className="template-input" name="template" placeholder="e.g. {Rank} {Full Name} enlisted in the Singapore Armed Forces on {Enlistment Date}. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Specialist Cadet Course. {Golden Bayonet} {Silver Bayonet} Subsequently, {Rank} {Surname} was posted to {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE) where he was assigned the role of {Primary Appointment}." value={template} disabled={edit_disabled}></textarea>
                </div>
                <div className="save-edit-delete-group">
                    <button type="submit" className={save_button_class}>Save</button>
                    <button onClick={onEdit} className={edit_button_class}>Edit</button>
                    <button onClick={onCancelChanges} className={cancel_button_class}>Cancel</button>
                    <button onClick={(event) => { onClickDelete(event, intro_index) }} className={delete_button_class}>Delete</button>
                    {save_status == "pending" && <div className="saving-text">Saving...</div>}
                    {save_status == "cancelling" && <div className="cancelling-text">Cancelling...</div>}                                             
                    {delete_status == "pending" && <div className="deleting-text">Deleting...</div>}                    
                </div>
            </form>
        </div>
    )
}