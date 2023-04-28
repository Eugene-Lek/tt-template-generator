import { useState } from "react";
import cloneDeep from 'lodash/cloneDeep';

export const PreUnitAchievementForm = ({
    id,
    achievement_title,
    previously_saved_achievement_title,
    achievement_wording,
    previously_saved_achievement_wording,
    pre_unit_achievements_list,
    set_pre_unit_achievements_list,
    button_state,
    form_index,
    unit,
    set_dialog_settings,
    permanently_disable_edit,
    display
}) => {

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
        const temp_pre_unit_achievements_list = cloneDeep(pre_unit_achievements_list)
        temp_pre_unit_achievements_list[form_index]['button_state'] = "save"
        set_pre_unit_achievements_list(temp_pre_unit_achievements_list)
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
        const temp_pre_unit_achievements_list = cloneDeep(pre_unit_achievements_list)
        temp_pre_unit_achievements_list[form_index]['button_state'] = "edit"
        temp_pre_unit_achievements_list[form_index]['achievement_title'] = previously_saved_achievement_title
        temp_pre_unit_achievements_list[form_index]['achievement_wording'] = previously_saved_achievement_wording
        set_pre_unit_achievements_list(temp_pre_unit_achievements_list)
        //console.log(temp_pre_unit_achievements_list)
    }


    /*FUNCTIONS THAT UPDATE pre_unit_achievements_list WHENEVER ANY (UNSAVED) CHANGES ARE MADE*/

    const onChangeText = (event, form_index) => {
        if (permanently_disable_edit) {
            return
        }

        const temp_pre_unit_achievements_list = cloneDeep(pre_unit_achievements_list)
        temp_pre_unit_achievements_list[form_index][event.target.name] = event.target.value
        set_pre_unit_achievements_list(temp_pre_unit_achievements_list)
        //console.log(temp_pre_unit_achievements_list)
    }


    /*FUNCTIONS WHICH MANAGE TO 'SAVE' OR 'DELETE' BUTTON CLICKS*/

    const onClickSave = async (event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        let achievement_title_cleaned = achievement_title.replace(/\s+/g, ' ').trim() // Removes all extra spaces
        let achievement_wording_cleaned = achievement_wording.replace(/[ \t\r\f\v]+/g, ' ').trim() // Removes all extra spaces except \n
        achievement_wording_cleaned = achievement_wording_cleaned.replace(/([^.])$/, '$1.') // Add full stop if it has been omitted
        // Uniqueness validation
        const existing_achievement_names = pre_unit_achievements_list
                                            .filter(obj=>obj.id !== id) // Remove the pre unit achievement obj that corresponds to the current one
                                            .map(obj=>obj.previously_saved_achievement_title.toLowerCase())
        if (existing_achievement_names.includes(achievement_title_cleaned.toLowerCase())){
            return displayErrorMessage(`'${achievement_title_cleaned}' already exists.`)
        }        
        //Check if the previously saved text is an empty string
        // If so, it is an update so a 'PUT' method should be used.
        // Otherwise, create a new Introduction object with 'POST'
        const is_update = previously_saved_achievement_title != ''
        const http_method = is_update ? "PUT" : "POST"
        createOrEditPreUnitAchievement({
            id,
            previously_saved_achievement_title,                    
            achievement_title: achievement_title_cleaned,
            achievement_wording: achievement_wording_cleaned,
            pre_unit_achievements_list,
            set_pre_unit_achievements_list,
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

        const achievement_title_cleaned = achievement_title.replace(/[ \t\r\f\v]+/g, ' ').trim() // Removes all extra spaces
        // If the achievement_title has not been saved previously, deleting the form will not alter anything in the database.
        // As such, call the delete function right away
        if (previously_saved_achievement_title == '') {
            deletePreUnitAchievement({
                id,
                achievement_title: achievement_title_cleaned,
                pre_unit_achievements_list,
                set_pre_unit_achievements_list,
                form_index,
                unit
            })
            return
        }

        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to delete '${previously_saved_achievement_title}' and its following wording?*

                 "${previously_saved_achievement_wording}"

                 *This deletion cannot be reversed, so you should store this wording somewhere on your computer so that way you can restore it in the future if need be.*`,
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
                achievement_title: achievement_title_cleaned,
                pre_unit_achievements_list,
                set_pre_unit_achievements_list,
                form_index,
                unit
            }
        })
    }


    const handleDeleteConfirmation = ({
        id,
        achievement_title,
        pre_unit_achievements_list,
        set_pre_unit_achievements_list,
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
        deletePreUnitAchievement({
            id,
            achievement_title,
            pre_unit_achievements_list,
            set_pre_unit_achievements_list,
            form_index,
            unit
        })
    }


    /* HELPER FUNCTIONS THAT DIRECTLY INVOKE API CALLS TO EXECUTE POST/PUT/DELETE REQUESTS */
    const createOrEditPreUnitAchievement = async ({
        id,
        achievement_title,
        previously_saved_achievement_title,        
        achievement_wording,
        pre_unit_achievements_list,
        set_pre_unit_achievements_list,
        form_index,
        unit,
        http_method
    }) => {
        try {
            const response = await fetch("/api/pre-unit-achievements", {
                method: http_method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                    achievement_title,
                    previously_saved_achievement_title,                            
                    achievement_wording
                })
            })
            // Only change the button displays when the data has been successfully saved
            if (response.status == 200) {
                set_save_button_class("save-changes-button-hidden")
                set_cancel_button_class("cancel-button-hidden")
                set_edit_button_class("edit-button-visible")
                set_delete_button_class("delete-button-visible")
                set_edit_disabled(true)
                const temp_pre_unit_achievements_list = cloneDeep(pre_unit_achievements_list)
                temp_pre_unit_achievements_list[form_index]['button_state'] = "edit"
                temp_pre_unit_achievements_list[form_index]['previously_saved_achievement_title'] = achievement_title
                temp_pre_unit_achievements_list[form_index]['achievement_title'] = achievement_title
                temp_pre_unit_achievements_list[form_index]['previously_saved_achievement_wording'] = achievement_wording
                temp_pre_unit_achievements_list[form_index]['achievement_wording'] = achievement_wording
                set_pre_unit_achievements_list(temp_pre_unit_achievements_list)
                // Remind the user to add the Pre-Unit Achievement to an Introduction
                if (http_method == "POST") {
                    set_dialog_settings({
                        "message":
                            `*Save Successful*
                            Don't forget to insert *{${achievement_title}}* into your Introduction template(s)!`,
                        "buttons": [
                            { text: "Close", action: "exit", background: "#01a4d9", color: "#FFFFFF" }
                        ],
                        "line_props": [
                            { color: "green", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                            {color: "#000000", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "auto"}                            
                        ],
                        "displayed": true,
                        "onClickDialog": closeDialogueBox,
                        "onClickDialogProps": { set_dialog_settings }
                    })                    
                }
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }


    const deletePreUnitAchievement = async ({
        id,
        achievement_title,
        pre_unit_achievements_list,
        set_pre_unit_achievements_list,
        form_index,
        unit,
    }) => {
        try {
            const response = await fetch("/api/pre-unit-achievements", {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                    achievement_title
                })
            })
            if (response.status == 200) {
                const temp_pre_unit_achievements_list = cloneDeep(pre_unit_achievements_list)
                temp_pre_unit_achievements_list.splice(form_index, 1)
                set_pre_unit_achievements_list(temp_pre_unit_achievements_list)
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
                    <p>Title:</p>
                    <input onChange={(event) => { onChangeText(event, form_index) }} className="title-input" name='achievement_title' placeholder="e.g. Sword of Honour" value={achievement_title} disabled={edit_disabled}></input>
                </div>
                <div className="template-group">
                    <p>Wording:</p>
                    <textarea onChange={(event) => { onChangeText(event, form_index) }} className="transcript-template-input" name='achievement_wording' placeholder="e.g. To this end, {Rank} {Surname} performed the best among his peers and graduated with a Sword of Honour (Top Performer)." value={achievement_wording} disabled={edit_disabled}></textarea>
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