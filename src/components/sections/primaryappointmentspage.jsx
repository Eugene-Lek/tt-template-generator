import { PrimaryAppointmentForm } from "src/components/forms/primaryappointmentform"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import Select from "react-select"
import cloneDeep from 'lodash/cloneDeep';

const valid_ranks = ["Officer", "Specialist", "Enlistee"]

export function PrimaryAppointmentsPage({ unit, section_name, available_vocation_ranks, set_dialog_settings, savedPersonalParticularsFields }) {

    const [load_status, set_load_status] = useState('loading')
    const [primary_appointments_list, set_primary_appointments_list] = useState([])
    const [selected_primary_appointment_vocation_rank, set_selected_primary_appointment_vocation_rank] = useState('')
    const [selected_primary_appointment_title, set_selected_primary_appointment_title] = useState('')

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

    // Make an API call to obtain the section information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const primary_appointments_response = await fetch(`/api/primaryappointments?unit=${unit}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (!primary_appointments_response.ok) {
                const response_data = await primary_appointments_response.json()
                displayErrorMessage(response_data.message)                          
                return
            }

            const primary_appointments_response_data = await primary_appointments_response.json()
            const init_primary_appointments_list = primary_appointments_response_data.init_list
            // Maintain the hidden state of forms. This means newly added but unsaved forms will remain displayed
            const init_primary_appointments_dict = Object.fromEntries(init_primary_appointments_list.map(obj => [obj.id, obj]))
            let temp_primary_appointments_list = cloneDeep(primary_appointments_list)
            temp_primary_appointments_list = temp_primary_appointments_list.map(obj => {
                if (obj.button_state == "save") {
                    // If there are any unsaved changes, DO NOT replace the form's data with the one from the database!
                    // Instead, keep the existing form data on the client side. (including the display state)
                    return obj
                }                  
                const live_display_state = obj.display
                if (init_primary_appointments_dict.hasOwnProperty(obj.id)) {
                    obj = init_primary_appointments_dict[obj.id]
                    obj.display = live_display_state // Keep the display up to date. a.k.a. do not let it return to the default 'block'
                }
                return obj
            })
            // Add primary_appointments that were added to the database but not the primary_appointments list (client-side)
            // (a.k.a. added via another device after the page of this device was loaded)
            const forms_filtered = init_primary_appointments_list.some(obj => obj.display == "none")
            const existing_client_forms_ids = temp_primary_appointments_list.map(obj => obj.id)
            init_primary_appointments_list.forEach(obj => {
                if (!existing_client_forms_ids.includes(obj.id)) {
                    obj.display = forms_filtered ? 'none' : 'block' // Hide if the forms are filtered on the client side
                    temp_primary_appointments_list.push(obj)
                }
            })
            set_primary_appointments_list(temp_primary_appointments_list)
            set_load_status('loaded')
        }
        fetchSectionData()

    }, [unit, [].concat(...primary_appointments_list.map(obj => obj.previously_saved_related_achievements.sort())).join(), savedPersonalParticularsFields])
    // ^Only reload the primary appointments data when any of the primary_appointment_achievement titles have been changed and saved
    // Note: This works by setting the dependency with a string of all the previously_saved_related_achievements combined
    // This way, the string and thus the dependency will change whenever a change is made and saved to any of the related achievement titles.


    const getVocationRanksTemplateOverview = (available_vocation_ranks, section_list) => {
        // Available vocation ranks is based on forms_list (Vocation-Ranks-Combi) & thus updates when forms_list updates.
        // However, when forms_list is updates, section list (e.g. Introductions_list) is not (designed to persist VRC connections)
        // Therefore, when a vocation or rank is deleted, it will remain in the section list, so optional querying must be employed. (in the .push)        
        let vocation_ranks_template_overview = cloneDeep(available_vocation_ranks)
        Object.keys(vocation_ranks_template_overview).forEach(vocation => {
            const rank_template_entries = vocation_ranks_template_overview[vocation].map(rank => [rank, []])
            vocation_ranks_template_overview[vocation] = Object.fromEntries(rank_template_entries)
        })
        section_list.forEach(section => {
            const section_related_vocation_ranks = section.previously_saved_related_vocation_ranks
            Object.keys(section_related_vocation_ranks).forEach(vocation => {
                section_related_vocation_ranks[vocation].forEach(rank => {
                    vocation_ranks_template_overview[vocation]?.[rank]?.push({ title: section.previously_saved_appointment, achievements: section.previously_saved_related_achievements.sort() })
                    vocation_ranks_template_overview[vocation]?.[rank]?.sort(function (a, b) {
                        var x = a.title
                        var y = b.title
                        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    }) // Sort by alphabetical order of appt
                })
            })
        })
        return vocation_ranks_template_overview
    }

    const onAddPrimaryAppointmentForm = (event) => {
        event.preventDefault()
        set_primary_appointments_list([{
            id: uuidv4(),
            appointment: "",
            previously_saved_appointment: "",
            template: "As a _________ , {rank} {first name} was responsible for _________ . {rank} {first name} was <Insert Trait of a Good _________ >. For example, <Insert specific incident(s) that demonstrate this trait>.",
            previously_saved_template: "",
            transcript_template: "As a _________ , {rank} {first name} was responsible for _________ .",
            previously_saved_transcript_template: "",
            related_vocation_ranks: {},
            previously_saved_related_vocation_ranks: {},
            previously_saved_related_achievements: [],
            button_state: "save"
        }, ...cloneDeep(primary_appointments_list)])
    }

    const onViewAll = (event) => {
        event.preventDefault()
        let temp_primary_appointments_list = cloneDeep(primary_appointments_list)
        temp_primary_appointments_list.forEach(primary_appointment => {
            primary_appointment['display'] = 'block'
        })
        set_primary_appointments_list(temp_primary_appointments_list)
        set_selected_primary_appointment_vocation_rank(null)
        set_selected_primary_appointment_title(null)
    }

    const onSelectByVocationRank = (option) => {
        // Necessary because selected_primary_appointment_vocation_rank is used to set the value of the select box
        set_selected_primary_appointment_vocation_rank(option)

        const rank_regex_expression = new RegExp(`${valid_ranks.join("|")}$`)
        const selected_rank = option.value.match(rank_regex_expression)[0]
        const selected_vocation = option.value.replace(rank_regex_expression, '').trim()
        let temp_primary_appointments_list = cloneDeep(primary_appointments_list)
        temp_primary_appointments_list.forEach(primary_appointment => {
            if (primary_appointment["related_vocation_ranks"][selected_vocation]?.includes(selected_rank) ||
                primary_appointment["previously_saved_related_vocation_ranks"][selected_vocation]?.includes(selected_rank)) {
                primary_appointment['display'] = 'block'
            }
            else {
                primary_appointment['display'] = 'none'
            }
        })
        set_primary_appointments_list(temp_primary_appointments_list)
        set_selected_primary_appointment_title(null) // Reset the other search bar
    }

    const onSelectByTitle = (option) => {
        // Necessary because selected_primary_appointment_vocation_rank is used to set the value of the select box
        set_selected_primary_appointment_title(option)

        const selected_primary_appointment = option.value
        let temp_primary_appointments_list = cloneDeep(primary_appointments_list)
        temp_primary_appointments_list.forEach(primary_appointment => {
            if (primary_appointment['appointment'] == selected_primary_appointment ||
                primary_appointment['previously_saved_appointment'] == selected_primary_appointment) {
                primary_appointment['display'] = 'block'
            }
            else {
                primary_appointment['display'] = 'none'
            }
        })
        set_primary_appointments_list(temp_primary_appointments_list)
        set_selected_primary_appointment_vocation_rank(null) // Reset the other search bar

    }
    // Call this function again every time the page reloads to get the most up to date list of vocation-ranks without templates
    // The page reloads whenever any setState function belonging to the page or its parent is called. 
    var vocation_ranks_template_overview = getVocationRanksTemplateOverview(available_vocation_ranks, primary_appointments_list)
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((vocation) => {
        return available_vocation_ranks[vocation].map(rank => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))
    let available_primary_appointment_titles = [].concat(...primary_appointments_list.map(appointment => [appointment.appointment, appointment.previously_saved_appointment]))
    available_primary_appointment_titles = [... new Set(available_primary_appointment_titles)].filter(option => option) // remove empty strings
    available_primary_appointment_titles.sort()
    const available_primary_appointment_options = available_primary_appointment_titles.map((appointment) => ({ label: appointment, value: appointment }))
    return (
        <>
            <div className="section-title">
                {section_name}
            </div>
            <div className="show-hide-bar">
                <details>
                    <summary className="instructions-summary">Instructions & Examples</summary>
                    <div className="section-group">
                        <div className="example-module">
                            <div className="example-module-title" style={{ textDecoration: "underline" }}>Contents</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>1. Assigning a Primary Appointment to a Vocation-Rank Combination (e.g. Signal Enlistee)</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>2. Inserting Personal Particulars into an Primary Appointment Template (e.g. Rank and Name)</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>3. Indicating Where Users Should Manually Insert Character Traits and Examples</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>4. Inserting Related Achievements (Optional)</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">1. Assigning a Primary Appointment to a Vocation-Rank Combination (e.g. Signal Enlistee)</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to add a Primary Appointment that only applies to Signal Enlistees:</div>
                            <PrimaryAppointmentForm
                                appointment="Signal Operator"
                                transcript_template="As a Signal Operator, ....."
                                template="As a Signal Operator, ....."
                                related_vocation_ranks={{ 'Signals': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                manual_related_achievements={[]}
                                display="block"
                            />
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">2. Inserting Personal Particulars into an Primary Appointment Template (e.g. Rank and Name)</div>
                            <div className="example-module-explanation">The following Personal Particulars will be collected and can be inserted into all templates:</div>
                            <ol>
                                <li>Rank</li>
                                <li>Full Name</li>
                                <li>Surname</li>
                                <li>Enlistment Date</li>
                                <li>Coy</li>
                                <li>Primary Appointment</li>
                            </ol>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to include these Personal Particulars in our Signal Operator template.</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Personal Particulars in curly brackets {'{ }'} e.g. {'{Rank}'} (case-insensitive).</div>
                            <PrimaryAppointmentForm
                                appointment="Signal Operator"
                                transcript_template="As a Signal Operator, {rank} {first name} was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company."
                                template="As a Signal Operator, {rank} {first name} was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company."
                                related_vocation_ranks={{ 'Signals': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                manual_related_achievements={[]}
                                display="block"
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Result:</div>
                            <div className="example-module-explanation">As a Signal Operator, CPL LEK was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company.</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">3. Indicating Where Users Should Manually Insert Character Traits and Examples</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want the Testimonial Template to remind users to add Character Traits and Incident(s) which demonstrate these traits.</div>
                            <div className="example-module-explanation">To do so, we need to include {"<Insert Character Trait>"} and {"<Insert specific examplet that demonstrates this trait>"}.</div>
                            <div className="example-module-explanation">Anything wraped in {"<"} and {">"} will be coloured red by the program to catch the user&apos;s attention (Note: It will only be coloured red in the result). </div>
                            <PrimaryAppointmentForm
                                appointment="Signal Operator"
                                transcript_template={'As a Signal Operator, {rank} {first name} was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company.'}
                                template="As a Signal Operator, {rank} {first name} was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company. In this role, {rank} {first name} was observed to have been <Trait of A Good Signaller (e.g Professional)> . For instance, <A specific incident that demonstrated this trait>."
                                related_vocation_ranks={{ 'Signals': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                manual_related_achievements={[]}
                                display="block"
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Result:</div>
                            <div className="example-module-explanation" >
                                <span>{"As a Signal Operator, CPL LEK was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company. In this role, {rank} {first name} was observed to have been "}</span>
                                <span style={{ color: "red" }}>{"<Trait of A Good Signaller (e.g Professional)>"}</span>
                                <span>{" . For instance, "}</span>
                                <span style={{ color: "red" }}>{"<A specific incident that demonstrated this trait>"}</span>
                                <span>.</span>
                            </div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">4. Inserting Related Achievements (Optional)</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to add &apos;REDCON 1&apos; as an achievement to the Signal Operator appointment</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Related Achievement (REDCON 1) in curly brackets {'{ }'} e.g. {'{REDCON 1}'} (case-insensitive).</div>
                            <PrimaryAppointmentForm
                                appointment="Signal Operator"
                                transcript_template={'As a Signal Operator, {rank} {first name} was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company.'}
                                template="As a Signal Operator, {rank} {first name} was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company. In this role, {rank} {first name} was observed to have been <Trait of A Good Signaller (e.g Professional)> . For instance, <A specific incident that demonstrated this trait>. {REDCON 1}"
                                related_vocation_ranks={{ 'Signals': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                manual_related_achievements={[{
                                    achievement_title: 'REDCON 1',
                                    achievement_wording: "As a result of his efforts, {rank} {first name} was able to contribute towards his Company's overall REDCON 1 result for their Evaluation Exercises — the highest attainable grade.",
                                    button_state: "save"
                                }]}
                                display="block"
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Important Note:</div>
                            <div className="example-module-explanation">If a Related Achievement is included in the template but is not selected by the user, it will not be part of the result. (see examples below)</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>REDCON 1 not Selected:</div>
                            <div className="example-module-explanation">
                                <span>{"As a Signal Operator, CPL LEK was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company. In this role, {rank} {first name} was observed to have been "}</span>
                                <span style={{ color: "red" }}>{"<Trait of A Good Signaller (e.g Professional)>"}</span>
                                <span>{" . For instance, "}</span>
                                <span style={{ color: "red" }}>{"<A specific incident that demonstrated this trait>"}</span>
                                <span>.</span>
                            </div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>REDCON 1 Selected:</div>
                            <div className="example-module-explanation">
                                <span>{"As a Signal Operator, CPL LEK was tasked to establish clear communications for the Company via various radio systems. Such radio systems were vital to enable the day-to-day training and operations for the Company. In this role, {rank} {first name} was observed to have been "}</span>
                                <span style={{ color: "red" }}>{"<Trait of A Good Signaller (e.g Professional)>"}</span>
                                <span>{" . For instance, "}</span>
                                <span style={{ color: "red" }}>{"<A specific incident that demonstrated this trait>"}</span>
                                <span>{". As a result of his efforts, CPL LEK was able to contribute towards his Company's overall REDCON 1 result for their Evaluation Exercises — the highest attainable grade."}</span>
                            </div>
                        </div>
                    </div>
                </details>
                <details>
                    <summary className="section-summary">Primary Appointment Templates</summary>
                    <div className="section-group">
                        {Object.entries(available_vocation_ranks).length == 0 &&
                            <div className="missing-vocation-ranks-warning">
                                <div className="missing-vocation-ranks-warning-text">
                                    <div style={{ fontWeight: 'bold', color: 'red', fontSize: "25px" }}>You have not added any relevant vocations & ranks yet!</div>
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>You should add some before adding any {section_name} templates (see the section at the top of the page).</div>
                                </div>
                            </div>
                        }
                        {(Object.entries(vocation_ranks_template_overview).length !== 0 && load_status == 'loaded') &&
                            <div className="vocation-ranks-overview">
                                <div className="vocation-ranks-overview-text">
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "30px" }}>Overview</div>
                                </div>
                                <div className="vocation-ranks-group">
                                    {Object.keys(vocation_ranks_template_overview).map((vocation, i_outer) => {
                                        return (
                                            <div key={i_outer} className="each-vocation-rank-group">
                                                {Object.keys(vocation_ranks_template_overview[vocation]).map((rank, i_inner) => (
                                                    <div key={(i_inner)}>
                                                        <div style={{ fontWeight: "bold", color: 'black', fontSize: "16px" }}>{vocation} {rank}</div>
                                                        {vocation_ranks_template_overview[vocation][rank].length > 0 ?
                                                            <ol>
                                                                {vocation_ranks_template_overview[vocation][rank].map((obj, i_inner2) => {
                                                                    return (
                                                                        <div key={i_inner2}>
                                                                            <li >{obj.title}</li>
                                                                            {obj.achievements.length > 0 ?
                                                                                <ul style={{ listStyleType: "circle" }}>
                                                                                    {obj.achievements.map((achievement, i_inner3) => <li key={i_inner3} >{achievement}</li>)}
                                                                                </ul>
                                                                                :
                                                                                null
                                                                            }
                                                                        </div>
                                                                    )
                                                                })}
                                                            </ol>
                                                            :
                                                            <ul>
                                                                <li style={{ color: "red" }}>None Provided</li>
                                                            </ul>
                                                        }
                                                    </div>
                                                ))}

                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        }
                        {load_status == 'loaded' && (
                            <div className="top-bar">
                                <div className="search-templates">
                                    <Select
                                        className="search-by-title"
                                        onChange={onSelectByTitle}
                                        options={available_primary_appointment_options}
                                        value={selected_primary_appointment_title}
                                        placeholder={"Search by Primary Appointment"}
                                    />
                                    <Select
                                        className="search-by-vocation-rank"
                                        onChange={onSelectByVocationRank}
                                        options={available_vocation_ranks_options}
                                        value={selected_primary_appointment_vocation_rank}
                                        placeholder={"Search by Vocation-Rank"}
                                    />
                                    <button onClick={onViewAll} className={"view-all-button"}>View All</button>
                                </div>
                                <button onClick={onAddPrimaryAppointmentForm} className="add-form-button-right">Add Primary Appointment</button>
                            </div>
                        )}
                        {load_status == 'loading' && (
                            <p className="loading-text-form-data">Loading...</p>
                        )}
                        {primary_appointments_list.map((primary_appointment, form_index) => {
                            return (
                                <PrimaryAppointmentForm
                                    key={primary_appointment.id}
                                    id={primary_appointment.id}
                                    appointment={primary_appointment.appointment}
                                    previously_saved_appointment={primary_appointment.previously_saved_appointment}
                                    template={primary_appointment.template}
                                    previously_saved_template={primary_appointment.previously_saved_template}
                                    transcript_template={primary_appointment.transcript_template}
                                    previously_saved_transcript_template={primary_appointment.previously_saved_transcript_template}
                                    related_vocation_ranks={primary_appointment.related_vocation_ranks}
                                    previously_saved_related_vocation_ranks={primary_appointment.previously_saved_related_vocation_ranks}
                                    available_vocation_ranks={available_vocation_ranks}
                                    button_state={primary_appointment.button_state}
                                    display={primary_appointment.display}
                                    primary_appointments_list={primary_appointments_list}
                                    set_primary_appointments_list={set_primary_appointments_list}
                                    form_index={form_index}
                                    unit={unit}
                                    set_dialog_settings={set_dialog_settings}
                                />
                            )
                        })}
                    </div>
                </details>
            </div>
        </>
    )
}

