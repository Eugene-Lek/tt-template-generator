import cloneDeep from 'lodash/cloneDeep';

const sections_with_sub_options = {
    "Primary Appointments": {
        subgroup: "achievements"
    }, 
    "Soldier Fundamentals": {
        subgroup: "awards"
    }
}


export function SectionCheckBoxes({
    section_name, 
    section_number, 
    unit_data, 
    form_data, 
    set_form_data, 
    selected_vocation_and_rank,
    selected_valid_vocation_rank
}){

    const onChangeCheckBox = (event) => {
        const temp_form_data = cloneDeep(form_data)
        temp_form_data[section_name][event.target.value] = event.target.checked
        set_form_data(temp_form_data)
    }  

    const onChangeSubCheckBox = (event) => {
        const temp_form_data = cloneDeep(form_data)
        if (!temp_form_data[section_name].hasOwnProperty(event.target.name) || 
            temp_form_data[section_name][event.target.name] == false ||
            temp_form_data[section_name][event.target.name] == true) {
            // This creates the property of the section_option if it doesnt exist because the user did not click its checkbox first
            temp_form_data[section_name][event.target.name] = {}
        }
        temp_form_data[section_name][event.target.name][event.target.value] = event.target.checked
        set_form_data(temp_form_data)
    }
    
    const getRelevantOptions = () =>{
        const option_category = section_name.replace(/\s+/g, '').replace(/-/g, '')
        const related_options = unit_data[option_category].map(obj=>{
            const related_vocation_ranks = obj.appliesto
            const matches_selected_vocation_rank = related_vocation_ranks
                                                    .filter(obj=> (obj.vocation == form_data['Vocation'] && obj.rank == form_data['Rank Category']))
                                                    .length
            if (matches_selected_vocation_rank){
                return obj.title
            }
        }).filter(option=>option) // filter out undefined elements
        return related_options
    }

    const getRelevantSubOptions = () => {
        const option_category = section_name.replace(/\s+/g, '').replace(/-/g, '')
        if (!Object.keys(sections_with_sub_options).includes(section_name)){
            return []
        }
        const option_sub_option_entries = unit_data[option_category].map(option_obj=>{
            const sub_option_group_name = sections_with_sub_options[section_name]["subgroup"]
            const sub_option_list = option_obj[sub_option_group_name]
            return [option_obj.title, sub_option_list.map(obj=>obj.title? obj.title : obj)]
        })
        return Object.fromEntries(option_sub_option_entries)
    }

    const relevant_section_options = getRelevantOptions() // Remove spaces to get the model name
    const relevant_section_sub_options = getRelevantSubOptions()
    return (
        <section>
            <h2 className="form-section-header">{section_number}. {section_name}</h2>
            {!selected_vocation_and_rank && (
                <p className="select-vocation-rank-warning">You have not selected the serviceman&apos;s vocation and rank category</p>
            )}
            {selected_vocation_and_rank && (
                relevant_section_options.map((section_option, checkbox_index)=>{
                    return (
                        <div key={checkbox_index}>
                            <input type="checkbox" name={section_name} value={section_option} onChange={onChangeCheckBox} checked={form_data[section_name][section_option]}/>
                            <label className="form-text">{section_option}</label>
                            <ul>
                                {Object.keys(relevant_section_sub_options).includes(section_option) && 
                                    relevant_section_sub_options[section_option].map((sub_option, sub_option_index)=>{
                                        return (
                                        <li key={sub_option_index}>
                                            <input type="checkbox" name={section_option} value={sub_option} onChange={onChangeSubCheckBox} checked={form_data[section_name][section_option]?.[sub_option]}/>
                                            <label className="form-text">{sub_option}</label>
                                        </li>
                                        )
                                    })}
                            </ul>
                        </div>  
                    )
                })                                   
            )}  
            {(selected_vocation_and_rank && selected_valid_vocation_rank && relevant_section_options.length==0) && (
                <>
                    <p className="select-vocation-rank-warning">{form_data["Vocation"]} {form_data["Rank Category"]}s do not have any corresponding {section_name}.</p>
                    {section_name == "Primary Appointments" && (
                        <>
                            <p className="select-vocation-rank-warning">This is an error as all vocation rank combinations should have at least 1 Primary Appointment.</p>                
                            <p className="select-vocation-rank-warning">Please inform your S1 department about it so that way they can address the issue.</p>                
                        </>                        
                    )}
                    {section_name !== "Primary Appointments" &&
                        <p className="select-vocation-rank-warning">Please contact your S1 department if you think this is a mistake.</p>                
                    }
                    
                </>
            )}
            {(selected_vocation_and_rank && !selected_valid_vocation_rank) && (
                <p className="select-vocation-rank-warning">{form_data["Vocation"]} {form_data["Rank Category"]}s do not exist in your unit. Please select another vocation and rank catgeory.</p>
            )} 
        </section>        
    )
}
