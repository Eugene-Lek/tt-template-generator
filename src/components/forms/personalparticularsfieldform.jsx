import { useState, useEffect } from "react"
import Select from "react-select";
import cloneDeep from 'lodash/cloneDeep';

const COMPULSORY_FIELDS = ["Rank", "Full Name"]
const FIELD_TYPE_OPTIONS = ["Text (Capitalised)", "Text (ALL CAPS)", "Date"].map(fieldType => ({ label: fieldType, value: fieldType }))


export const PersonalParticularsFieldsForm = ({
    personalParticularsFields,
    setPersonalParticularsFields,
    savedPersonalParticularsFields,
    setSavedPersonalParticularsFields,    
    order,
    unit,
    set_dialog_settings
}) => {
    let { id, name, type } = personalParticularsFields[order]
    const [editMode, setEditMode] = useState(name || COMPULSORY_FIELDS.includes(name)? false : true)

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

    const savePersonalParticularsFields = async () => {

        // Data cleaning       
        name = name.replace(/[ \t\r\f\v]+/g, ' ').trim() // remove empty spaces

        // Check if the old field name is present in any templates
        
        const response = await fetch(`/api/personalparticularsfields?fieldName=${savedPersonalParticularsFields[order]?.name}&unitName=${unit}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }

        })
        const { fieldIsUsed } = await response.json()
        if (savedPersonalParticularsFields[order] && savedPersonalParticularsFields[order]?.name.toLowerCase() != name.toLowerCase() && fieldIsUsed) { // If name has been edited, seek confirmation
            set_dialog_settings({
                "message":
                    `*Confirmation*
                    *{${savedPersonalParticularsFields[order].name}}* is currently present in one or more templates. 
                    Please confirm that you want to replace *{${savedPersonalParticularsFields[order].name}}* with *{${name}}* in all existing templates.                    
                    `,
                "buttons": [
                    { text: "Confirm", action: "update", background: "#E60023", color: "#FFFFFF" },
                    { text: "Cancel", action: "cancel", background: "#00ac13", color: "#FFFFFF" }
                ],
                "line_props": [
                    { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                    { color: "#000000", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "left" }],
                "displayed": true,
                "onClickDialog": createOrEditParticularsFields,
                "onClickDialogProps": { name, type }
            })
        } else {
            createOrEditParticularsFields({ name, type })
        }
    }
    const createOrEditParticularsFields = async ({ name, type, action }) => {

        if (action) { // if the action attribute exists because the function is called from the dialog box
            closeDialogueBox() // Close dialog box no matter what
            if (action == "cancel" || action == "exit") return // Break out of the function if it was cancelled
        }

        const response = await fetch("/api/personalparticularsfields", {
            method: savedPersonalParticularsFields[order] ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalParticularsField: { name, type, id, order },
                previouslySavedName: savedPersonalParticularsFields[order]?.name,
                unit
            })
        })

        if (response.status == 200) {
            setEditMode(false)

            setSavedPersonalParticularsFields(prevValues => {
                const temp = cloneDeep(prevValues)
                temp[order] = { name, type, id, order }
                return temp
            })            

        } else {
            // Display the error message in a dialogue box
            const response_data = await response.json()
            if (response_data.message.includes("Unique constraint failed")) {
                displayErrorMessage(`"${name}" already exists.`)
            } else {
                displayErrorMessage(response_data.message)
            }
        }
    }

    const deleteField = async () => {
        const remainingFields = cloneDeep(savedPersonalParticularsFields)
        remainingFields.splice(order, 1)

        const response = await fetch("/api/personalparticularsfields", {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalParticularsField: { name, id, order },
                unit,
                remainingFields
            })
        })

        if (response.status == 200) {
            const index = order
            setPersonalParticularsFields(prevValues => {
                const temp = cloneDeep(prevValues)
                temp.splice(index, 1)
                return temp
            })
            setSavedPersonalParticularsFields(prevValues => {
                const temp = cloneDeep(prevValues)
                temp.splice(index, 1)
                return temp
            })            

        } else {
            // Display the error message in a dialogue box
            const response_data = await response.json()
            displayErrorMessage(response_data.message)
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
                <input
                    style={{ width: "200px", fontSize: "16px", boxSizing: "border-box", border: "2px solid #ccc", borderRadius: "4px" }}
                    placeholder="Field name"
                    value={personalParticularsFields[order].name}
                    onChange={(event) => {
                        setPersonalParticularsFields(prevValues => {
                            const temp = cloneDeep(prevValues)
                            temp[order].name = event.target.value
                            return temp
                        })
                    }}
                    disabled={!editMode} />
                <Select
                    placeholder="Type"
                    styles={{
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            width: "150px"
                        }),
                    }}
                    options={FIELD_TYPE_OPTIONS}
                    value={{ label: type, value: type }}
                    onChange={(event) => {
                        setPersonalParticularsFields(prevValues => {
                            const temp = cloneDeep(prevValues)
                            temp[order].type = event.value
                            return temp
                        })
                    }}
                    isDisabled={!editMode}
                    instanceId={personalParticularsFields[order].id} />
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
                <button type="submit" onClick={savePersonalParticularsFields} style={{ display: editMode ? "block" : "none", backgroundColor: "#00ac13", fontWeight: "bold", width: "90px", border: "0px", borderRadius: "20px", color: "white", fontSize: "20px" }}>Save</button>
                <button onClick={() => { setEditMode(true) }} style={{ display: editMode || COMPULSORY_FIELDS.includes(name) ? "none" : "block", backgroundColor: "#01a4d9", fontWeight: "bold", width: "90px", border: "0px", borderRadius: "20px", color: "white", fontSize: "20px" }}>Edit</button>
                <button onClick={() => { setPersonalParticularsFields(savedPersonalParticularsFields); setEditMode(false) }} style={{ display: editMode ? "block" : "none", backgroundColor: "#ff7f0e", fontWeight: "bold", width: "90px", border: "0px", borderRadius: "20px", color: "white", fontSize: "20px" }}>Cancel</button>
                <button onClick={deleteField} style={{ display: editMode || COMPULSORY_FIELDS.includes(name) ? "none" : "block", backgroundColor: "#E60023", fontWeight: "bold", width: "90px", border: "0px", borderRadius: "20px", color: "white", fontSize: "20px" }}>Delete</button>
            </div>
        </div>
    )
}