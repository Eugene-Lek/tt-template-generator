export const AdminHeader = ({ title, subtitle, unit, id, set_dialog_settings }) => {

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
                { color: "red", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                ...error_lines_props],
            "displayed": true,
            "onClickDialog": closeDialogueBox,
            "onClickDialogProps": { set_dialog_settings }
        })
    }


    const displayPassword = (random_password) => {
        set_dialog_settings({
            "message": `*This is ${unit}'s account password:*
                        ${random_password}
                        *You must store this somewhere as the system cannot display it again.*`,
            "buttons": [
                { text: "Close", action: "exit", background: "#01a4d9", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "0" },
                { color: "#000000", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "0" },
                { color: "red", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "0" },
            ],
            "displayed": true,
            "onClickDialog": closeDialogueBox,
            "onClickDialogProps": { set_dialog_settings }
        })
    }

    /*HANDLE CLICK RESET PASSWORD*/
    const onClickResetPassword = (event) => {
        event.preventDefault()
        event.stopPropagation()
        // Generate a Reset Password Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to reset the password of the ${unit}'s admin account?*

                *This action is irreversible and the unit's current password will no longer be valid.*`,
            "buttons": [
                { text: "Yes", action: "delete", background: "#E60023", color: "#FFFFFF" },
                { text: "No", action: "cancel", background: "#00ac13", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "0" },
                { color: "red", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0" }],
            "displayed": true,
            "onClickDialog": handleResetPasswordConfirmation,
            "onClickDialogProps": {
                id,
            },
            "isBlocking": true
        })
    }

    /*FUNCTIONS THAT HANDLE THE USER'S RESPONSE TO THE RESET PASSWORD DIALOG*/
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
                displayPassword(response_data.random_password)
            } else if (!response.ok) {
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }

        } catch (error) {
            displayErrorMessage(error.message)
        }

    }

    return (
        <>
            <header>
                <h1 className="header-title">{title}</h1>
                <h3 className="header-subtitle">{subtitle}</h3>
            </header>
        </>
    )
}