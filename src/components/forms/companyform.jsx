import { useState } from "react"
import cloneDeep from 'lodash/cloneDeep';


export const CompaniesForm = ({
    init_companies,
    unit,
    set_dialog_settings
}) => {

    const [companies_data, set_companies_data] = useState(init_companies)
    const button_state = companies_data['button_state']

    /*INITIALISING OF DISPLAY*/
    if (button_state === "edit") {
        var init_save_button_class = "save-changes-button-hidden"
        var init_cancel_button_class = "cancel-button-hidden"
        var init_edit_button_class = "edit-button-visible"
        var init_delete_button_class = "delete-button-hidden"
        var init_add_small_form_button_class = "add-small-form-button-hidden"
        var init_edit_disabled = true
    } else if (button_state === "save") {
        var init_save_button_class = "save-changes-button-visible"
        var init_cancel_button_class = "cancel-button-visible"
        var init_edit_button_class = "edit-button-hidden"
        var init_delete_button_class = "delete-button-hidden"
        var init_add_small_form_button_class = "add-small-form-button-visible"        
        var init_edit_disabled = false
    }
    const [save_button_class, set_save_button_class] = useState(init_save_button_class)
    const [cancel_button_class, set_cancel_button_class] = useState(init_cancel_button_class)
    const [edit_button_class, set_edit_button_class] = useState(init_edit_button_class)
    const [delete_button_class, set_delete_button_class] = useState(init_delete_button_class)
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

        set_save_button_class("save-changes-button-visible")
        set_cancel_button_class("cancel-button-visible")
        set_delete_button_class('delete-button-visible')
        set_add_small_form_button_class('add-small-form-button-visible')
        set_edit_button_class("edit-button-hidden")
        set_edit_disabled(false)
        const temp_companies_data = cloneDeep(companies_data)
        temp_companies_data['button_state'] = "save"
        set_companies_data(temp_companies_data)
    }

    const onCancelChanges = (event) => {
        event.preventDefault()

        set_save_button_class("save-changes-button-hidden")
        set_cancel_button_class("cancel-button-hidden")
        set_delete_button_class('delete-button-hidden')
        set_add_small_form_button_class('add-small-form-button-hidden')        
        set_edit_button_class("edit-button-visible")
        set_edit_disabled(true)
        const temp_companies_data = cloneDeep(companies_data)
        temp_companies_data['button_state'] = "edit"
        temp_companies_data['companies'] = cloneDeep(temp_companies_data['previously_saved_companies'])
        set_companies_data(temp_companies_data)  
    }

    /*FUNCTIONS WHICH MANAGE TO 'SAVE' BUTTON CLICKS*/

    const onClickSave = async (event) => {
        event.preventDefault()

        const companies_cleaned = companies_data['companies'].map(company => company.replace(/\s+/g, ' ').trim()).filter(company => company) // remove empty strings
        try {
            const response = await fetch("/api/companies", {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit,
                    companies: companies_cleaned
                })
            })
            // Only change the button displays when the data has been successfully saved
            if (response.status == 200) {
                set_save_button_class("save-changes-button-hidden")
                set_cancel_button_class("cancel-button-hidden")
                set_delete_button_class('delete-button-hidden')
                set_add_small_form_button_class('add-small-form-button-hidden')                   
                set_edit_button_class("edit-button-visible")
                set_edit_disabled(true)
                const temp_companies_data = cloneDeep(companies_data)
                temp_companies_data['button_state'] = "edit"                
                temp_companies_data['previously_saved_companies'] = cloneDeep(companies_cleaned)
                temp_companies_data['companies'] = cloneDeep(companies_cleaned) // Display the cleaned companies              
                set_companies_data(temp_companies_data)
                //console.log(temp_companies_data)               
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }

    const onAddCompanyForm = (event) => {
        event.preventDefault()
        const temp_companies_data = cloneDeep(companies_data)
        temp_companies_data['companies'].push('')
        set_companies_data(temp_companies_data)
    }

    const onClickDeleteCompany = (event, index) => {
        event.preventDefault()
        const temp_companies_data = cloneDeep(companies_data)
        temp_companies_data['companies'].splice(index, 1)
        set_companies_data(temp_companies_data)
        console.log(temp_companies_data)
    }

    const onChangeCompany = (event, index) => {
        event.preventDefault()
        const temp_companies_data = cloneDeep(companies_data)
        temp_companies_data['companies'][index] = event.target.value
        set_companies_data(temp_companies_data)
        console.log(temp_companies_data)
    }


    return (
        <>
            <form onSubmit={onClickSave} className="companies-form">
                <div className="companies-group">
                    {companies_data['companies'].map((company, index) => {
                        return (
                            <div key={index} className="company-group">
                                <input onChange={(event) => { onChangeCompany(event, index) }} className="title-input" placeholder="e.g. 'A' or Headquarters" value={company} disabled={edit_disabled}></input>
                                <button onClick={(event) => { onClickDeleteCompany(event, index) }} className={delete_button_class}>Delete</button>
                            </div>
                        )
                    })}
                    <button onClick={onAddCompanyForm} className={add_small_form_button_class}>Add Company</button>
                </div>
                <div className="save-edit-delete-group">
                    <button type="submit" className={save_button_class}>Save</button>
                    <button onClick={onEdit} className={edit_button_class}>Edit</button>
                    <button onClick={onCancelChanges} className={cancel_button_class}>Cancel</button>
                </div>
            </form>
        </>
    )
}