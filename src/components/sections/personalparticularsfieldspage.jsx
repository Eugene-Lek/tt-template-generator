import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { PersonalParticularsFieldsForm } from "../forms/personalparticularsfieldform";

export const PersonalParticularsFieldsPage = ({
    personalParticularsFields,
    setPersonalParticularsFields,
    savedPersonalParticularsFields,
    setSavedPersonalParticularsFields,
    unit,
    set_dialog_settings
}) => {
    const [editMode, setEditMode] = useState(false)


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

    return (
        <>
            <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", marginLeft: "auto", marginRight: "auto", gap: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px", width: "fit-content" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {personalParticularsFields.map((fieldSet, index) => (
                            <PersonalParticularsFieldsForm
                                key={fieldSet.id}
                                personalParticularsFields={personalParticularsFields}
                                setPersonalParticularsFields={setPersonalParticularsFields}
                                savedPersonalParticularsFields={savedPersonalParticularsFields}
                                setSavedPersonalParticularsFields={setSavedPersonalParticularsFields}                                
                                order={index}
                                unit={unit}
                                set_dialog_settings={set_dialog_settings}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => { setPersonalParticularsFields([...personalParticularsFields, { id: uuidv4(), name: "", type: "Text", order: personalParticularsFields.length }]) }}
                        style={{ backgroundColor: "#7868ff", fontWeight: "bold", border: "0px", borderRadius: "20px", color: "white", fontSize: "18px" }}
                    >Add Personal Particulars Field</button>
                </div>
            </div>
        </>
    )
}