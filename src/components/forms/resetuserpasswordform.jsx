import {useFormik} from "formik"

const PASSWORD_MIN_LENGTH = 10

export default function ResetUserPaswordForm({ unit, unitID, set_dialog_settings }) {
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

    const displayPassword = (new_password) => {
        set_dialog_settings({
            "message": `*Update Successful*
                        *This is the updated User Password:*
                        ${new_password}
                        *You must store this somewhere as the system cannot display it again.*`,
            "buttons": [
                { text: "Close", action: "exit", background: "#01a4d9", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                { color: "#000000", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "0" },
                { color: "#000000", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "0" },
                { color: "red", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "0" },
            ],
            "displayed": true,
            "onClickDialog": closeDialogueBox,
            "onClickDialogProps": { set_dialog_settings }
        })
    }

    const resetPassword = async ({
        current_password,
        new_password,
        confirm_new_password,
    }) => {
        try {
            // Parameter validation
            if (!new_password || !confirm_new_password) { throw new Error("You did not key in the new password and/or confirm new password") }

            const passwordsMatch = new_password == confirm_new_password
            if (!passwordsMatch) {throw new Error("Passwords do not match")}

            if (new_password.length < PASSWORD_MIN_LENGTH) { throw new Error(`Your password must be at least ${PASSWORD_MIN_LENGTH} characters long`) }
            
            // Execute the update
            const response = await fetch("/api/units", {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: unitID,
                    unit,
                    field_to_patch: "userPassword",
                    new_password,
                    current_password
                })
            })
            if (response.status == 200) {
                const response_data = await response.json()
                displayPassword(response_data.new_password)
                formik.resetForm()
            } else if (!response.ok) {
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }

        } catch (error) {
            displayErrorMessage(error.message)
        }

    }
    const formik = useFormik({
        onSubmit: resetPassword,
        initialValues: { current_password: '', new_password: '', confirm_new_password: '' }
    })

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
            <div style={{ fontWeight: "bold", fontSize: "32px"}}>Reset User Password</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <input type="password" id={"current_password"} {...formik.getFieldProps("current_password")} style={{ width: "200px", height: "32px", fontSize: "16px", boxSizing: "border-box", border: "2px solid #ccc", borderRadius: "4px" }} placeholder="Current Password" />                
                <input type="password" id={"new_password"} {...formik.getFieldProps("new_password")} style={{ width: "200px", height: "32px", fontSize: "16px", boxSizing: "border-box", border: "2px solid #ccc", borderRadius: "4px" }} placeholder="New Password" />
                <input type="password" id={"confirm_new_password"} {...formik.getFieldProps("confirm_new_password")} style={{ width: "200px", height: "32px", fontSize: "16px", boxSizing: "border-box", border: "2px solid #ccc", borderRadius: "4px" }} placeholder="Confirm New Password" />
            </div>
            <button type="button" onClick={formik.handleSubmit} style={{ backgroundColor: "#01a4d9", fontWeight: "bold", width: "200px", border: "0px", borderRadius: "20px", color: "white", fontSize: "20px"}}>Save Password</button>            
        </div>
    )
}

