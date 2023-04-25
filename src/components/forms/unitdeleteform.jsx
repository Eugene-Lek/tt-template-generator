const onClickDelete = async (event, index) => {
    event.preventDefault()
    if (previously_saved_unit == '') {
        deleteUnit({
            id,
            unit,
            units_data,
            set_units_data,
            index,
            unit
        })
        return
    }

    // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
    set_dialog_settings({
        "message":
            `*Are you sure you want to delete the unit '${previously_saved_unit}'?*
            *Note:* If you wish to re-add the unit '${previously_saved_unit}' later on, you must spell it exactly as '${previously_saved_unit}' (case-sensitive).
             Otherwise, you will need to manually re-select all the templates that apply to it.`,
        "buttons": [
            { text: "Yes", action: "delete", background: "#E60023", color: "#FFFFFF" },
            { text: "No", action: "cancel", background: "#00ac13", color: "#FFFFFF" }
        ],
        "line_props": [
            { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
            { color: "#000000", font_size: "16px", text_align: "left",margin_right: "auto", margin_left: "0" }],
        "displayed": true,
        "onClickDialog": handleDeleteConfirmation,
        "onClickDialogProps": {
            id,
            unit,
            units_data,
            set_units_data,
            index,
            unit
        }
    })
}

/*FUNCTIONS WHICH HANDLE A USER'S RESPONSE TO THE DISPLAYED DIALOGUE BOX*/

const handleDeleteConfirmation = ({
    id,
    unit,
    units_data,
    set_units_data,
    index,
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
    deleteUnit({
        id,
        unit,
        units_data,
        set_units_data,
        index,
    })
}

const deleteUnit = async ({
    id,
    unit,
    units_data,
    set_units_data,
    index,
}) => {
    try {
        const response = await fetch("/api/units", {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
            })
        })
        if (response.status == 200) {
            const temp_units_data = cloneDeep(units_data)
            temp_units_data.splice(index, 1)
            set_units_data(temp_units_data)
        } else if (!response.ok) {
            const response_data = await response.json()
            displayErrorMessage(response_data.message)
        }

    } catch (error) {
        displayErrorMessage(error.message)
    }

}