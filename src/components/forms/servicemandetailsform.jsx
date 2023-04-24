import { useState } from "react"
import cloneDeep from 'lodash/cloneDeep';
import { SectionCheckBoxes } from "./sectioncheckboxes";


const complusory_fields = [
    'Rank',
    'Full Name',
    'Surname',
    'Enlistment Date',
    'Coy',
    'Vocation',
    'Rank Category',
    'Primary Appointments'
]

export default function ServicemanDetailsForm({selected_unit, unit_data, set_dialog_settings}){

    const [form_data, set_form_data] = useState({
        'Rank': '',
        'Full Name': '',
        'Surname': '',
        'Enlistment Date': '',
        'Coy': '',
        'Vocation': '',
        'Rank Category': '',
        'Pre-Unit Achievements': {},
        'Primary Appointments': {},
        'Secondary Appointments': {},
        'Soldier Fundamentals': {},
        'Other Contributions': {},
        'Other Individual Achievements': {},
    })
    
    // Parameter Validation
    if (!selected_unit){
        return (
            <p className="select-unit-warning">Please select your unit first :)</p>
        )
    }
    // Placeholder while the data is being fetched
    if (!unit_data){
        return (
            <p className="loading-text-root">Loading...</p>
        )
    }

    console.log(form_data)

    const selected_vocation_and_rank = form_data['Vocation'] !== '' && form_data['Rank Category'] !== ''
    const unit_vocations = unit_data.Vocations.map(obj=>obj.name)
    const unit_vocation_ranks = [].concat(...unit_data.Vocations.map(obj=> obj.ranks.map(rank=>[obj.name, rank])))
    let selected_valid_vocation_rank = false
    for (let i=0; i < unit_vocation_ranks.length; i++){
        if (unit_vocation_ranks[i][0] == form_data['Vocation'] && unit_vocation_ranks[i][1] == form_data['Rank Category']){
            selected_valid_vocation_rank = true
            break
        }
    }    

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

    const onChangeString = (event) => {
        const temp_form_data = cloneDeep(form_data)
        temp_form_data[event.target.name] = event.target.value
        set_form_data(temp_form_data)
        console.log(temp_form_data)
    }

    const onGenerate = async(event) => {
        event.preventDefault()
        // Client-side parameter validation
        const missing_data = Object.keys(form_data).map(field=>{
            if (!complusory_fields.includes(field)){
                return
            }
            if (field != 'Primary Appointments'){
                return form_data[field] == '' ? field : null
            }
            else if (field == 'Primary Appointments'){
                const no_selections = Object.values(form_data[field]).length == 0 || 
                                      Object.values(form_data[field]).every(selection=>!selection) // check if every selection is false
                if (no_selections){
                    return field
                }
            }
        }).filter(field=>field) // remove undefined elements
        if (missing_data.length > 0){
            displayErrorMessage(`Please provide the following information: 
                                ${missing_data.map((field, index)=>`${index+1}. ${field}`).join("\n")}`)
        }
        console.log("Submitted")
        try {
            const response = await fetch('/api/generatetemplate', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    form_data,
                    selected_unit,
                    complusory_fields
                })
            })  
            if (response.status == 200) {
                console.log(response)
                const response_blob = await response.blob()
                const url = URL.createObjectURL(response_blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `(T&T Template) ${form_data["Rank"]} ${form_data["Full Name"]}.docx`
                document.body.appendChild(a)
                a.click()
                a.remove()                
            } else if (!response.ok) {
                // Display the error message in a dialogue box
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }                      
        } catch (error) {
            displayErrorMessage(error.message)
        }
    }

    return (
        <form className="user-form">
            <section>
                <h2 className="form-section-header">1. Personal Particulars</h2>
                <div className="form-input-field-group">
                    <label className="form-text">Rank:</label>
                    <input type="text" className="form-input" name="Rank" value={form_data['Rank']} onChange={onChangeString}/>
                </div>
                <div className="form-input-field-group">
                    <label className="form-text">Full Name:</label>
                    <input type="text" className="form-input" name="Full Name" value={form_data['Full Name']} onChange={onChangeString}/>
                </div>
                <div className="form-input-field-group">
                    <label className="form-text">Surname:</label>
                    <input type="text" className="form-input" name="Surname" value={form_data['Surname']} onChange={onChangeString}/>
                </div>
                <div className="form-input-field-group">
                    <label className="form-text">Enlistment Date:</label>
                    <input type="date" className="form-input" name="Enlistment Date" value={form_data['Enlistment Date']} onChange={onChangeString}/>
                </div>           
                <div className="radio-button-group">
                    <div>
                        <h3 className="form-section-sub-header">
                            Coy
                        </h3>
                        {unit_data.Companies.length == 0 && (
                            <p className="no-companies-warning">Your S1 department has not added any Coys yet.</p>
                        )}
                        {unit_data.Companies.map((company, index)=>{
                            return (
                                <div key={index}>
                                    <input type="radio" name="Coy" value={company} onClick={onChangeString}/>
                                    <label className="form-text">{company}</label>
                                </div>  
                            )
                        })}  
                    </div>   
                    <div>
                        <h3 className="form-section-sub-header">
                            Vocation
                        </h3>
                        {unit_vocations.length == 0 && (
                            <p className="no-vocations-warning">Your S1 department has not added any Vocations yet.</p>
                        )}
                        {unit_vocations.map((vocation, index)=>{
                            return (
                                <div key={index}>
                                    <input type="radio" name="Vocation" value={vocation} onClick={onChangeString}/>
                                    <label className="form-text">{vocation}</label>
                                </div>  
                            )
                        })}                          
                    </div>  
                    <div>
                        <h3 className="form-section-sub-header">
                            Rank Category
                        </h3>
                        <div>
                            <input type="radio" name="Rank Category" value="Officer" onClick={onChangeString}/>
                            <label className="form-text">Officer</label>
                        </div>
                        <div>
                            <input type="radio" name="Rank Category" value="Specialist" onClick={onChangeString}/>
                            <label className="form-text">Specialist</label>
                        </div>
                        <div>
                            <input type="radio" name="Rank Category" value="Enlistee" onClick={onChangeString}/>
                            <label className="form-text">Enlistee</label>
                        </div> 
                    </div>                            
                </div>            
            </section>
            <SectionCheckBoxes
                section_name={"Pre-Unit Achievements"}
                section_number={2}
                unit_data={unit_data}
                form_data={form_data}
                set_form_data={set_form_data}
                selected_vocation_and_rank={selected_vocation_and_rank}
                selected_valid_vocation_rank={selected_valid_vocation_rank}
            />
            <SectionCheckBoxes
                section_name={"Primary Appointments"}
                section_number={3}
                unit_data={unit_data}
                form_data={form_data}
                set_form_data={set_form_data}
                selected_vocation_and_rank={selected_vocation_and_rank}
                selected_valid_vocation_rank={selected_valid_vocation_rank}
            />
            <SectionCheckBoxes
                section_name={"Secondary Appointments"}
                section_number={4}
                unit_data={unit_data}
                form_data={form_data}
                set_form_data={set_form_data}
                selected_vocation_and_rank={selected_vocation_and_rank}
                selected_valid_vocation_rank={selected_valid_vocation_rank}
            />
            <SectionCheckBoxes
                section_name={"Soldier Fundamentals"}
                section_number={5}
                unit_data={unit_data}
                form_data={form_data}
                set_form_data={set_form_data}
                selected_vocation_and_rank={selected_vocation_and_rank}
                selected_valid_vocation_rank={selected_valid_vocation_rank}
            />
            <SectionCheckBoxes
                section_name={"Other Contributions"}
                section_number={6}
                unit_data={unit_data}
                form_data={form_data}
                set_form_data={set_form_data}
                selected_vocation_and_rank={selected_vocation_and_rank}
                selected_valid_vocation_rank={selected_valid_vocation_rank}
            />
            <SectionCheckBoxes
                section_name={"Other Individual Achievements"}
                section_number={7}
                unit_data={unit_data}
                form_data={form_data}
                set_form_data={set_form_data}
                selected_vocation_and_rank={selected_vocation_and_rank}
                selected_valid_vocation_rank={selected_valid_vocation_rank}
            />
            <button onClick={onGenerate} className="generate-button">Submit</button>
        </form>
    )
}