import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import cloneDeep from 'lodash/cloneDeep';


export const SoldierFundamentalForm = ({
    id,
    official_name,
    previously_saved_official_name,
    awards,
    previously_saved_awards,
    related_vocation_ranks,
    previously_saved_related_vocation_ranks,
    available_vocation_ranks,
    soldier_fundamentals_list,
    set_soldier_fundamentals_list,
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
        var init_small_delete_button_class = "delete-button-hidden"
        var init_add_small_form_button_class = "add-small-form-button-hidden"
        var init_edit_disabled = true
    } else if (button_state === "save") {
        var init_save_button_class = "save-changes-button-visible"
        var init_cancel_button_class = "cancel-button-visible"
        var init_edit_button_class = "edit-button-hidden"
        var init_delete_button_class = "delete-button-hidden"
        var init_small_delete_button_class = "delete-button-hidden"
        var init_add_small_form_button_class = "add-small-form-button-visible"        
        var init_edit_disabled = false
    }
    const [save_button_class, set_save_button_class] = useState(init_save_button_class)
    const [cancel_button_class, set_cancel_button_class] = useState(init_cancel_button_class)
    const [edit_button_class, set_edit_button_class] = useState(init_edit_button_class)
    const [delete_button_class, set_delete_button_class] = useState(init_delete_button_class)
    const [small_delete_button_class, set_small_delete_button_class] = useState(init_small_delete_button_class)
    const [add_small_form_button_class, set_add_small_form_button_class] = useState(init_add_small_form_button_class)    
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
        set_small_delete_button_class('delete-button-visible')
        set_add_small_form_button_class('add-small-form-button-visible')        
        set_edit_disabled(false)
        const temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list[form_index]['button_state'] = "save"
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
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
        set_small_delete_button_class('delete-button-hidden')
        set_add_small_form_button_class('add-small-form-button-hidden')        
        set_edit_disabled(true)
        const temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list[form_index]['button_state'] = "edit"
        temp_soldier_fundamentals_list[form_index]['official_name'] = previously_saved_official_name
        temp_soldier_fundamentals_list[form_index]['awards'] = cloneDeep(previously_saved_awards)
        temp_soldier_fundamentals_list[form_index]['related_vocation_ranks'] = cloneDeep(previously_saved_related_vocation_ranks)
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
        //console.log(temp_soldier_fundamentals_list)        
    }


    /*FUNCTIONS THAT UPDATE soldier_fundamentals_list WHENEVER ANY (UNSAVED) CHANGES ARE MADE*/

    const onChangeText = (event, form_index) => {

        if (permanently_disable_edit) {
            return
        }

        const temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list[form_index][event.target.name] = event.target.value
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
        console.log(temp_soldier_fundamentals_list)
    }

    const onChangeCheckbox = (event, form_index) => {

        if (permanently_disable_edit) {
            return
        }

        const [checkbox_rank, checkbox_vocation] = event.target.name.split("||")
        let temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)

        if (event.target.checked) {
            temp_soldier_fundamentals_list[form_index]['related_vocation_ranks'][checkbox_rank].push(checkbox_vocation)
        } else {
            temp_soldier_fundamentals_list[form_index]['related_vocation_ranks'][checkbox_rank] = temp_soldier_fundamentals_list[form_index]['related_vocation_ranks'][checkbox_rank]
                .filter(vocation => vocation !== checkbox_vocation)
        }

        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
        console.log(temp_soldier_fundamentals_list)
    }

    const onAllRank = (event, form_index) => {
        const checkbox_rank = event.target.name
        let temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)

        if (event.target.checked) {
            temp_soldier_fundamentals_list[form_index]['related_vocation_ranks'][checkbox_rank] = cloneDeep(available_vocation_ranks[checkbox_rank])
        } else {
            temp_soldier_fundamentals_list[form_index]['related_vocation_ranks'][checkbox_rank] = []
        }
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
        console.log(temp_soldier_fundamentals_list)
    }


    /*FUNCTIONS WHICH MANAGE TO 'SAVE' OR 'DELETE' BUTTON CLICKS*/

    const onClickSave = async (event) => {
        event.preventDefault()

        if (permanently_disable_edit) {
            return
        }

        const official_name_cleaned = official_name.replace(/\s+/g, ' ').trim()
        const awards_cleaned = awards.map(award=>award.replace(/\s+/g, ' ').trim()).filter(award=>award) // remove empty strings
        //Check if the previously saved text is an empty string
        // If so, it is an update so a 'PUT' method should be used.
        // Otherwise, create a new Introduction object with 'POST'
        const is_update = previously_saved_official_name != ''
        const http_method = is_update ? "PUT" : "POST"
        createOrEditSoldierFundamental({
            id,
            official_name: official_name_cleaned,
            awards: awards_cleaned,
            related_vocation_ranks,
            soldier_fundamentals_list,
            set_soldier_fundamentals_list,
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


        // If the official_name has not been saved previously, deleting the form will not alter anything in the database.
        // As such, call the delete function right away
        if (previously_saved_official_name == '') {
            deleteSoldierFundamental({
                id,
                soldier_fundamentals_list,
                set_soldier_fundamentals_list,
                form_index,
                unit
            })
            return
        }

        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to delete '${previously_saved_official_name}'and its following awards?*

                 ${previously_saved_awards.join(", ")}

                 *This deletion cannot be reversed, so you should store these awards somewhere on your computer so that way you can restore it in the future if need be.*`,
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
                soldier_fundamentals_list,
                set_soldier_fundamentals_list,
                form_index,
                unit,
            }
        })
    }


    const handleDeleteConfirmation = ({
        id,
        soldier_fundamentals_list,
        set_soldier_fundamentals_list,
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
        deleteSoldierFundamental({
            id,
            soldier_fundamentals_list,
            set_soldier_fundamentals_list,
            form_index,
            unit
        })
    }


    /* HELPER FUNCTIONS THAT DIRECTLY INVOKE API CALLS TO EXECUTE POST/PUT/DELETE REQUESTS */
    const createOrEditSoldierFundamental = async ({
        id,
        official_name,
        awards,
        related_vocation_ranks,
        soldier_fundamentals_list,
        set_soldier_fundamentals_list,
        form_index,
        unit,
        http_method
    }) => {
        try {
            const response = await fetch("/api/soldierfundamentals", {
                method: http_method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                    official_name,
                    awards,
                    related_vocation_ranks
                })
            })
            // Only change the button displays when the data has been successfully saved
            if (response.status == 200) {
                set_save_button_class("save-changes-button-hidden")
                set_cancel_button_class("cancel-button-hidden")
                set_edit_button_class("edit-button-visible")
                set_delete_button_class("delete-button-visible")
                set_small_delete_button_class('delete-button-hidden')
                set_add_small_form_button_class('add-small-form-button-hidden')                 
                set_edit_disabled(true)
                const temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
                temp_soldier_fundamentals_list[form_index]['button_state'] = "edit"
                temp_soldier_fundamentals_list[form_index]['previously_saved_official_name'] = official_name
                temp_soldier_fundamentals_list[form_index]['official_name'] = official_name // Display the cleaned official_name                  
                temp_soldier_fundamentals_list[form_index]['previously_saved_awards'] = cloneDeep(awards)
                temp_soldier_fundamentals_list[form_index]['awards'] = cloneDeep(awards) // Display the cleaned awards              
                temp_soldier_fundamentals_list[form_index]['previously_saved_related_vocation_ranks'] = cloneDeep(related_vocation_ranks)
                set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
                //console.log(temp_soldier_fundamentals_list)               
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }


    const deleteSoldierFundamental = async ({
        id,
        soldier_fundamentals_list,
        set_soldier_fundamentals_list,
        form_index,
        unit,
    }) => {
        try {
            const response = await fetch("/api/soldierfundamentals", {
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
                const temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
                temp_soldier_fundamentals_list.splice(form_index, 1)
                set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
            } else if (!response.ok) {
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }

        } catch (error) {
            displayErrorMessage(error.message)
        }

    }

    const onAddAwardForm = (event) => {
        event.preventDefault()
        const temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list[form_index]['awards'].push('')
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
    }

    const onClickDeleteAward = (event, award_index) => {
        event.preventDefault()
        const temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list[form_index]['awards'].splice(award_index, 1)
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)        
        console.log(temp_soldier_fundamentals_list)
    }

    const onChangeAward = (event, award_index) => {
        event.preventDefault()
        const temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list[form_index]['awards'][award_index] = event.target.value
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)   
        console.log(temp_soldier_fundamentals_list)
    }


    return (
        <div style={{display: display}}>
            <form onSubmit={onClickSave} className="section-module">
                <div className="template-group">
                    <p>Official Name:</p>
                    <input onChange={(event) => { onChangeText(event, form_index) }} className="title-input" name='official_name' placeholder="e.g. Individual Physical Proficiency Test" value={official_name} disabled={edit_disabled}></input>
                </div>
                <div className="applies-to-vrc">
                    <p>This Soldier Fundamental applies to:</p>
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
                    <div className="awards-group">
                        <p>Award:</p>
                            {awards.map((award, award_index) => {
                                return (
                                    <div key={award_index} className="award-group">
                                        <input onChange={(event) => { onChangeAward(event, award_index) }} className="title-input" name='official_name' placeholder="e.g. Gold Award" value={award} disabled={edit_disabled}></input>
                                        <button onClick={(event) => { onClickDeleteAward(event, award_index) }} className={small_delete_button_class}>Delete</button>
                                    </div>
                                )
                            })}
                            <button onClick={onAddAwardForm} className={add_small_form_button_class}>Add Award</button>
                    </div>
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