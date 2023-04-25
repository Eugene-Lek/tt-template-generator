import { useRef, useState } from "react";
import cloneDeep from 'lodash/cloneDeep';

export const VocationRankForm = ({
    id,
    raw_vocation,
    previously_saved_vocation,
    ranks,
    previously_saved_ranks,
    button_state,
    forms_list,
    set_forms_list,
    index,
    unit,
    dialog_settings,
    set_dialog_settings
}) => {
    /*INITIALISING OF DISPLAY*/

    const inputVocation = useRef()
    const inputOfficer = useRef()
    const inputSpecialist = useRef()
    const inputEnlistee = useRef()

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
        const error_lines_props = Array(error_num_lines).fill({
            color: "#000000", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "auto"
        })
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
        set_save_button_class("save-changes-button-visible")
        set_cancel_button_class("cancel-button-visible")
        set_edit_button_class("edit-button-hidden")
        set_delete_button_class("delete-button-hidden")
        set_edit_disabled(false)
        const temp_forms_list = cloneDeep(forms_list)
        temp_forms_list[index]['button_state'] = "save"
        set_forms_list(temp_forms_list)
    }

    const onCancelChanges = (event) => {
        event.preventDefault()
        set_save_button_class("save-changes-button-hidden")
        set_cancel_button_class("cancel-button-hidden")
        set_edit_button_class("edit-button-visible")
        set_delete_button_class("delete-button-visible")
        set_edit_disabled(true)
        const temp_forms_list = cloneDeep(forms_list)
        temp_forms_list[index]['button_state'] = "edit"
        temp_forms_list[index]['raw_vocation'] = previously_saved_vocation
        temp_forms_list[index]['ranks'] = cloneDeep(previously_saved_ranks)
        set_forms_list(temp_forms_list)
        //console.log(temp_forms_list)
    }


    /*FUNCTIONS THAT UPDATE FORMS_LIST WHENEVER ANY (UNSAVED) CHANGES ARE MADE*/

    const onChangeText = (event, index) => {
        const temp_forms_list = cloneDeep(forms_list)
        temp_forms_list[index]['raw_vocation'] = event.target.value
        set_forms_list(temp_forms_list)
        //console.log(temp_forms_list)
    }

    const onChangeCheckbox = (event, index) => {
        const temp_forms_list = cloneDeep(forms_list)
        temp_forms_list[index]['ranks'][event.target.name] = event.target.checked
        set_forms_list(temp_forms_list)
        //console.log(temp_forms_list)
    }


    /*FUNCTIONS WHICH MANAGE TO 'SAVE' OR 'DELETE' BUTTON CLICKS*/

    const onClickSave = async (event) => {
        event.preventDefault()
        //console.log(temp_forms_list)
        const vocation = inputVocation.current.value.replace(/\s+/g, ' ').trim() // Removes all extra spaces
        const have_officer = inputOfficer.current.checked
        const have_specialist = inputSpecialist.current.checked
        const have_enlistee = inputEnlistee.current.checked
        //Check if the previously saved text is an empty string
        // If so, it is an update so a 'PUT' method should be used.
        // Otherwise, create a new vocation object with 'POST'
        const is_update = previously_saved_vocation != ''
        const http_method = is_update ? "PUT" : "POST"
        // If the method is "POST", execute the vocation creation
        // If the method is "PUT" but the vocation name remains the same, execute the update
        // Otherwise, ask the user if the previous and current texts refer to the same vocation and respond accordingly
        if (http_method == "POST" || previously_saved_vocation == vocation) {
            createOrEditVocation({
                id,
                vocation,
                have_officer,
                have_specialist,
                have_enlistee,
                forms_list,
                set_forms_list,
                index,
                unit,
                http_method
            })
        } else {
            set_dialog_settings({
                "message":
                    `*Do '${previously_saved_vocation}' and '${vocation}' refer to the same vocation?*
                    *If Yes:* The templates currently associated with '${previously_saved_vocation}' will be transferred to '${vocation}'.
                    *If No:* The templates currently associated with '${previously_saved_vocation}' will *not* be transferred to '${vocation}'.`,
                "buttons": [
                    { text: "Yes", action: "update", background: "#E60023", color: "#FFFFFF" },
                    { text: "No", action: "delete old & create new", background: "#00ac13", color: "#FFFFFF" }
                ],
                "line_props": [
                    { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                    { color: "#000000", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "left" },
                    { color: "#000000", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "left" }],
                "displayed": true,
                "onClickDialog": handleEditType,
                "onClickDialogProps": {
                    id,
                    vocation,
                    have_officer,
                    have_specialist,
                    have_enlistee,
                    forms_list,
                    set_forms_list,
                    index,
                    unit
                }
            })
        }
    }

    const onClickDelete = async (event, index) => {
        event.preventDefault()
        let vocation = inputVocation.current.value.replace(/\s+/g, ' ').trim() // Removes all extra spaces
        vocation = vocation.charAt(0).toUpperCase() + vocation.slice(1) // Uppercases the first letter of each word
        const have_officer = inputOfficer.current.checked
        const have_specialist = inputSpecialist.current.checked
        const have_enlistee = inputEnlistee.current.checked
        // If the vocation has not been saved previously, deleting the form will not alter anything in the database.
        // As such, call the delete function right away
        if (previously_saved_vocation == '') {
            deleteVocation({
                id,
                vocation,
                have_officer,
                have_specialist,
                have_enlistee,
                forms_list,
                set_forms_list,
                index,
                unit
            })
            return
        }

        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to delete the vocation '${previously_saved_vocation}'?*
                
                If you wish to re-add the vocation '${previously_saved_vocation}' later on, you must spell it exactly as '${previously_saved_vocation}' (case-sensitive).
                Otherwise, you will need to manually re-select all the templates that apply to it.`,
            "buttons": [
                { text: "Yes", action: "delete", background: "#E60023", color: "#FFFFFF" },
                { text: "No", action: "cancel", background: "#00ac13", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                { color: "#000000", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0"},
                { color: "#000000", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0"}],
            "displayed": true,
            "onClickDialog": handleDeleteConfirmation,
            "onClickDialogProps": {
                id,
                vocation,
                have_officer,
                have_specialist,
                have_enlistee,
                forms_list,
                set_forms_list,
                index,
                unit
            }
        })
    }

    /*FUNCTIONS WHICH HANDLE A USER'S RESPONSE TO THE DISPLAYED DIALOGUE BOX*/

    const handleEditType = async ({
        id,
        vocation,
        have_officer,
        have_specialist,
        have_enlistee,
        forms_list,
        set_forms_list,
        index,
        unit,
        action
    }) => {
        // Close the dialog no matter the selection
        closeDialogueBox()
        // Execute the operations based on the admin's selection      
        if (action == "update") {
            createOrEditVocation({
                id,
                vocation,
                have_officer,
                have_specialist,
                have_enlistee,
                forms_list,
                set_forms_list,
                index,
                unit,
                http_method: "PUT"
            })
        } else if (action == "delete old & create new") {
            // Delete the old vocation object, then create a new one with the same id.
            // Using await is essential as it ensures the delete API call is executed before the create API call.
            // Otherwise, if create is executed before delete, it will not be possible to create a new vocation object
            // as the old one with the same id still exists
            await deleteVocation({
                id,
                vocation,
                have_officer,
                have_specialist,
                have_enlistee,
                forms_list,
                set_forms_list,
                index,
                unit
            })
            await createOrEditVocation({
                id,
                vocation,
                have_officer,
                have_specialist,
                have_enlistee,
                forms_list,
                set_forms_list,
                index,
                unit,
                http_method: "POST"
            })
        }
    }

    const handleDeleteConfirmation = ({
        id,
        vocation,
        have_officer,
        have_specialist,
        have_enlistee,
        forms_list,
        set_forms_list,
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
        deleteVocation({
            id,
            vocation,
            have_officer,
            have_specialist,
            have_enlistee,
            forms_list,
            set_forms_list,
            index,
            unit
        })
    }


    /* HELPER FUNCTIONS THAT DIRECTLY INVOKE API CALLS TO EXECUTE POST/PUT/DELETE REQUESTS */
    const createOrEditVocation = async ({
        id,
        vocation,
        have_officer,
        have_specialist,
        have_enlistee,
        forms_list,
        set_forms_list,
        index,
        unit,
        http_method
    }) => {
        try {
            const response = await fetch("/api/vocation-rank-combinations", {
                method: http_method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                    vocation,
                    have_officer,
                    have_specialist,
                    have_enlistee
                })
            })
            // Only change the button displays when the data has been successfully saved
            if (response.status == 200) {
                set_save_button_class("save-changes-button-hidden")
                set_cancel_button_class("cancel-button-hidden")
                set_edit_button_class("edit-button-visible")
                set_delete_button_class("delete-button-visible")
                set_edit_disabled(true)
                const temp_forms_list = cloneDeep(forms_list)
                temp_forms_list[index]['button_state'] = "edit"
                temp_forms_list[index]['previously_saved_vocation'] = vocation
                temp_forms_list[index]['vocation'] = vocation // Display the cleaned vocation
                temp_forms_list[index]['previously_saved_ranks'] = { have_officer, have_enlistee, have_specialist }
                set_forms_list(temp_forms_list)
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }

    const deleteVocation = async ({
        id,
        vocation,
        have_officer,
        have_specialist,
        have_enlistee,
        forms_list,
        set_forms_list,
        index,
        unit,
    }) => {
        try {
            const response = await fetch("/api/vocation-rank-combinations", {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                    vocation,
                    have_officer,
                    have_specialist,
                    have_enlistee
                })
            })
            if (response.status == 200) {
                const temp_forms_list = cloneDeep(forms_list)
                temp_forms_list.splice(index, 1)
                set_forms_list(temp_forms_list)
            } else if (!response.ok) {
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }

        } catch (error) {
            displayErrorMessage(error.message)
        }

    }


    /*PAGE HTML*/

    return (
        <form onSubmit={onClickSave} className="vocation-module">
            <input onChange={(event) => { onChangeText(event, index) }} className="vocation-input" ref={inputVocation} placeholder="Vocation" value={raw_vocation} disabled={edit_disabled}></input>
            <div className="rank-category-options">
                <div>
                    <input onChange={(event) => { onChangeCheckbox(event, index) }} ref={inputOfficer} type="checkbox" name="have_officer" checked={ranks.have_officer} disabled={edit_disabled}></input>
                    <label>Officer</label>
                </div>
                <div>
                    <input onChange={(event) => { onChangeCheckbox(event, index) }} ref={inputSpecialist} type="checkbox" name="have_specialist" checked={ranks.have_specialist} disabled={edit_disabled}></input>
                    <label>Specialist</label>
                </div>
                <div>
                    <input onChange={(event) => { onChangeCheckbox(event, index) }} ref={inputEnlistee} type="checkbox" name="have_enlistee" checked={ranks.have_enlistee} disabled={edit_disabled}></input>
                    <label>Enlistee</label>
                </div>
            </div>
            <div className="save-edit-delete-group">
                <button type="submit" className={save_button_class}>Save</button>
                <button onClick={onEdit} className={edit_button_class}>Edit</button>
                <button onClick={onCancelChanges} className={cancel_button_class}>Cancel</button>
                <button onClick={(event) => { onClickDelete(event, index) }} className={delete_button_class}>Delete</button>
            </div>
        </form>
    )
}