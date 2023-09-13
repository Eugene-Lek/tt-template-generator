import { useState } from "react";
import cloneDeep from 'lodash/cloneDeep';

export const UnitForm = ({
    id,
    unit,
    previously_saved_unit,
    overview_data,
    button_state,
    units_data,
    set_units_data,
    index,
    set_dialog_settings,
    set_create_unit_dialog_settings,
    display
}) => {
    /*INITIALISING OF DISPLAY*/

    if (button_state === "edit") {
        var init_save_button_class = "save-changes-button-hidden"
        var init_cancel_button_class = "cancel-button-invisible"
        var init_edit_button_class = "edit-button-visible"
        var init_reset_password_button_class = "reset-password-button-hidden"
        var init_edit_disabled = true
    } else if (button_state === "save") {
        var init_save_button_class = "save-changes-button-visible"
        var init_cancel_button_class = "cancel-button-visible"
        var init_edit_button_class = "edit-button-hidden"
        var init_reset_password_button_class = "reset-password-button-visible"
        var init_edit_disabled = false
    }
    const [save_button_class, set_save_button_class] = useState(init_save_button_class)
    const [cancel_button_class, set_cancel_button_class] = useState(init_cancel_button_class)
    const [edit_button_class, set_edit_button_class] = useState(init_edit_button_class)
    const [reset_password_button_class, set_reset_password_button_class] = useState(init_reset_password_button_class)
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
                { color: "red", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                ...error_lines_props],
            "displayed": true,
            "onClickDialog": closeDialogueBox,
            "onClickDialogProps": { set_dialog_settings }
        })
    }


    const displayPassword = (new_password) => {
        set_dialog_settings({
            "message": `*This is ${unit.toUpperCase().replace(/\s+/g, ' ').trim()}'s account password:*
                        ${new_password}
                        *You must store this somewhere as the system cannot display it again.*`,
            "buttons": [
                { text: "Close", action: "exit", background: "#01a4d9", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#000000", font_size: "25px", text_align: "left", margin_right: "auto", margin_left: "0" },
                { color: "#000000", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0" },
                { color: "red", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0" },
            ],
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
        set_reset_password_button_class("reset-password-button-visible")
        set_edit_disabled(false)
        const temp_units_data = cloneDeep(units_data)
        temp_units_data[index]['button_state'] = "save"
        set_units_data(temp_units_data)
    }

    const onCancelChanges = (event) => {
        event.preventDefault()
        set_save_button_class("save-changes-button-hidden")
        set_cancel_button_class("cancel-button-invisible")
        set_edit_button_class("edit-button-visible")
        set_reset_password_button_class("reset-password-button-hidden")
        set_edit_disabled(true)
        const temp_units_data = cloneDeep(units_data)
        temp_units_data[index]['button_state'] = "edit"
        temp_units_data[index]['unit'] = previously_saved_unit
        set_units_data(temp_units_data)
        //console.log(temp_units_data)
    }

    /*FUNCTIONS THAT UPDATE UNITS_DATA WHENEVER ANY (UNSAVED) CHANGES ARE MADE*/

    const onChangeText = (event, index) => {
        const temp_units_data = cloneDeep(units_data)
        temp_units_data[index]['unit'] = event.target.value
        set_units_data(temp_units_data)
        console.log(temp_units_data)
    }


    /*FUNCTIONS WHICH MANAGE TO 'SAVE' OR 'RESET PASSWORD' BUTTON CLICKS*/

    const onClickResetPassword = (event) => {
        event.preventDefault()
        event.stopPropagation()
        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to reset the password of the ${previously_saved_unit}'s admin account?*

                *This action is irreversible and the unit's current password will no longer be valid.*`,
            "buttons": [
                { text: "Yes", action: "delete", background: "#E60023", color: "#FFFFFF" },
                { text: "No", action: "cancel", background: "#00ac13", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#000000", font_size: "25px", text_align: "left", margin_right: "auto", margin_left: "0" },
                { color: "red", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0" }],
            "displayed": true,
            "onClickDialog": handleResetPasswordConfirmation,
            "onClickDialogProps": {
                id,
            }
        })
    }

    const onClickSave = async (event) => {
        event.preventDefault()
        //console.log(temp_units_data)
        const unit_cleaned = unit.toUpperCase().replace(/\s+/g, ' ').trim()
        // Parameter Validation
        if (units_data.map(obj=>{if(obj.id != id){return obj.previously_saved_unit}}).includes(unit_cleaned)){
            displayErrorMessage(`${unit_cleaned} already exists. Please pick another name.`)
            return 
        }
        if (!unit_cleaned){
            displayErrorMessage(`Please provide a unit name`)
            return 
        }
        if (!unit_cleaned.match(/^[0-9A-Z ]+$/)){
            displayErrorMessage(`The unit name can only include alphabets, numbers, and spaces`)
            return             
        }
        //Check if the previously saved text is an empty string
        // If so, it is an update so a 'PATCH' method should be used.
        // Otherwise, create a new unit object with 'POST'
        const is_update = previously_saved_unit != ''
        const http_method = is_update ? "PATCH" : "POST"
        if (http_method == "PATCH"){
            createOrEditUnit({
                id,
                unit: unit_cleaned,
                units_data,
                set_units_data,
                index,
                http_method
            })
        } else if (http_method == "POST"){
            set_create_unit_dialog_settings({
                "unit": unit,
                "displayed": true,
                "onClickDialog": handleCreateUnitSelection,
                "onClickDialogProps": {
                    id,
                    unit: unit_cleaned,
                    units_data,
                    set_units_data,
                    index,
                    http_method                    
                }
            })
        }

    }

    /*FUNCTIONS THAT HANDLE THE USER'S RESPONSE TO THE RESET PASSWORD/CREATE UNIT DIALOG*/
    const handleResetPasswordConfirmation = ({
        id,
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
        // Otherwise execute the reset password operation
        resetPassword({
            id
        })
    }

    const handleCreateUnitSelection = ({
        id,
        unit,
        units_data,
        set_units_data,
        index,
        http_method,
        selected_copy_unit,                
        action
    }) => {
        // Close the dialog no matter what
        set_create_unit_dialog_settings({
            "unit": '',
            "displayed": false,
            "onClickDialog": function () { return },
            "onClickDialogProps": {}
        })
        // Break out of the function if the delete operation is cancelled
        if (action == "cancel" || action == "exit") {
            return
        }
        // Otherwise execute the reset password operation
        if (!units_data.map(unit_data=>unit_data.previously_saved_unit).includes(selected_copy_unit)){
            // If the selected_copy_unit is not a previously saved unit, i.e. it is "Do not Initialise",
            // set the selected_copy_unit to '' so the api will automatically create an empty unit account
            selected_copy_unit = ''
        }
        createOrEditUnit({
            id,
            unit,
            units_data,
            set_units_data,
            index,
            http_method,
            selected_copy_unit,
        })
    }    

    /* HELPER FUNCTIONS THAT DIRECTLY INVOKE API CALLS TO EXECUTE POST/PATCH/DELETE REQUESTS */
    const createOrEditUnit = async ({
        id,
        unit,
        units_data,
        set_units_data,
        index,
        http_method,
        selected_copy_unit,
    }) => {
        console.log(unit)
        try {
            const response = await fetch("/api/units", {
                method: http_method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    id,
                    field_to_patch: "unitName",
                    selected_copy_unit
                })
            })
            // Only change the button displays when the data has been successfully saved
            if (response.status == 200) {
                const temp_units_data = cloneDeep(units_data)
                temp_units_data[index]['button_state'] = "edit"
                temp_units_data[index]['previously_saved_unit'] = unit
                temp_units_data[index]['unit'] = unit // Display the cleaned unit
                set_units_data(temp_units_data)
                console.log(temp_units_data)
                // Display the generated password if the Unit Admin Account is newly created
                const response_data = await response.json()
                if (response_data.new_password) {
                    displayPassword(response_data.new_password)
                }
                set_save_button_class("save-changes-button-hidden")
                set_cancel_button_class("cancel-button-invisible")
                set_edit_button_class("edit-button-visible")
                set_reset_password_button_class("reset-password-button-hidden")
                set_edit_disabled(true)
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }

    const resetPassword = async ({
        id
    }) => {
        try {
            const response = await fetch("/api/units", {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id,
                    field_to_patch: "password"
                })
            })
            if (response.status == 200) {
                const response_data = await response.json()
                displayPassword(response_data.new_password)
                set_save_button_class("save-changes-button-hidden")
                set_cancel_button_class("cancel-button-invisible")
                set_edit_button_class("edit-button-visible")
                set_reset_password_button_class("reset-password-button-hidden")
                set_edit_disabled(true)
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
        <div style={{ display: display }}>
            <form className="unit-module">
                <div className="unit-input-button-group">
                    <input onChange={(event) => { onChangeText(event, index) }} className="unit-input" placeholder="Unit Name (All Caps)" value={unit} disabled={edit_disabled} autoCapitalize="characters"></input>
                    <div className="save-edit-delete-group">
                        <button onClick={onClickSave} className={save_button_class}>Save</button>
                        <button onClick={onEdit} className={edit_button_class}>Edit</button>
                        <button onClick={onCancelChanges} className={cancel_button_class}>Cancel</button>
                    </div>
                </div>
                <button onClick={onClickResetPassword} className={reset_password_button_class}>Reset Password</button>
                <div className="unit-overview">
                    <div>
                        <div className="overview-header">Personal Particular Fields</div>
                        {overview_data.PersonalParticularsFields?.length > 0 ?
                            <div className="overview-text">{overview_data.PersonalParticularsFields.map(fieldSet => `${fieldSet.name} (${fieldSet.type})`).join(", ")}</div>
                            : <div className="overview-text" style={{ color: "red" }}>No Personal Particular Fields have been added yet</div>}
                    </div>
                    <div>
                        <div className="overview-header">Vocations</div>
                        {overview_data.Vocations?.length > 0 ?
                            <div className="overview-text" >{overview_data.Vocations.map(obj => obj.name).join(", ")}</div>
                            : <div className="overview-text" style={{ color: "red" }}>No Vocations have been added yet</div>}
                    </div>
                    <div>
                        <div className="overview-header">Number of Templates</div>
                        <div className="overview-text">Introductions: {overview_data.Introductions.length}</div>
                        <div className="overview-text">Pre-Unit Achievements: {overview_data.PreUnitAchievements.length}</div>
                        <div className="overview-text">Primary Appointments: {overview_data.PrimaryAppointments.length}</div>
                        <div className="overview-text">Secondary Appointments: {overview_data.SecondaryAppointments.length}</div>
                        <div className="overview-text">Soldier Fundamentals: {overview_data.SoldierFundamentals.length}</div>
                        <div className="overview-text">Other Contributions: {overview_data.OtherContributions.length}</div>
                        <div className="overview-text">Other Individual Achievements: {overview_data.OtherIndividualAchievements.length}</div>
                        <div className="overview-text">Conclusions: {overview_data.Conclusions.length}</div>
                    </div>
                </div>
            </form>
        </div>
    )
}