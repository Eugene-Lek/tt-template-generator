import { SecondaryAppointmentForm } from "src/components/forms/secondaryappointmentform"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import Select from "react-select"
import cloneDeep from 'lodash/cloneDeep';

const valid_ranks = ["Officer", "Specialist", "Enlistee"]

export function SecondaryAppointmentsPage({ unit, section_name, available_vocation_ranks, set_dialog_settings }) {

    const [load_status, set_load_status] = useState('loading')
    const [secondary_appointments_list, set_secondary_appointments_list] = useState([])
    const [selected_secondary_appointment_vocation_rank, set_selected_secondary_appointment_vocation_rank] = useState('')
    const [selected_secondary_appointment_title, set_selected_secondary_appointment_title] = useState('')

    // Make an API call to obtain the section information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const secondary_appointments_response = await fetch(`/api/secondaryappointments?unit=${unit}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const secondary_appointments_response_data = await secondary_appointments_response.json()
            console.log(secondary_appointments_response_data.init_list)
            set_secondary_appointments_list(secondary_appointments_response_data.init_list)  
            set_load_status('loaded')  
        }
        fetchSectionData()

    }, [unit])


    const getVocationRanksWithMissingTemplates = (available_vocation_ranks, section_list, related_vocation_ranks_type) => {
        const vocation_ranks_without_templates_entries = Object.keys(available_vocation_ranks).map((rank_type) => {
            // Generate the missing vocation list based either on saved or unsaved vocation-template assignments. 
            const nested_vocations_assigned_templates_list = section_list.map((section) => section[related_vocation_ranks_type][rank_type])
            const vocations_assigned_templates_list = [].concat(...nested_vocations_assigned_templates_list)
            const missing_vocations_list = available_vocation_ranks[rank_type].filter((vocation) => !vocations_assigned_templates_list.includes(vocation))
            if (missing_vocations_list.length == 0) {
                // Return nothing due to no missing vocations for a particular rank
                return
            }
            return [rank_type, missing_vocations_list]
        })
        const vocation_ranks_without_templates = Object.fromEntries(vocation_ranks_without_templates_entries.filter((element) => element)) // Remove undefined elements due to no missing vocations for a particular rank
        return vocation_ranks_without_templates
    }



    const onAddSecondaryAppointmentForm = (event) => {
        event.preventDefault()
        set_secondary_appointments_list([{
            id: uuidv4(),
            appointment: "",
            previously_saved_appointment: "",
            template: "",
            previously_saved_template: "",
            transcript_template: "",
            previously_saved_transcript_template: "",
            related_vocation_ranks: {
                Officer: [],
                Specialist: [],
                Enlistee: []
            },
            previously_saved_related_vocation_ranks: {
                Officer: [],
                Specialist: [],
                Enlistee: []
            },
            button_state: "save"
        }, ...cloneDeep(secondary_appointments_list)])
    }

    const onViewAll = (event) => {
        event.preventDefault()
        let temp_secondary_appointments_list = cloneDeep(secondary_appointments_list)
        temp_secondary_appointments_list.forEach(secondary_appointment => {
            secondary_appointment['display'] = 'block'
        })
        set_secondary_appointments_list(temp_secondary_appointments_list)
        set_selected_secondary_appointment_vocation_rank(null)
        set_selected_secondary_appointment_title(null)
    }

    const onSelectByVocationRank = (option) => {
        // Necessary because selected_secondary_appointment_vocation_rank is used to set the value of the select box
        set_selected_secondary_appointment_vocation_rank(option)

        const rank_regex_expression = new RegExp(`${valid_ranks.join("|")}$`)
        const selected_rank = option.value.match(rank_regex_expression)[0]
        const selected_vocation = option.value.replace(rank_regex_expression, '').trim()
        let temp_secondary_appointments_list = cloneDeep(secondary_appointments_list)
        temp_secondary_appointments_list.forEach(secondary_appointment => {
            if (secondary_appointment["related_vocation_ranks"][selected_rank]?.includes(selected_vocation) ||
                secondary_appointment["previously_saved_related_vocation_ranks"][selected_rank]?.includes(selected_vocation)) {
                secondary_appointment['display'] = 'block'
            }
            else {
                secondary_appointment['display'] = 'none'
            }
        })
        set_secondary_appointments_list(temp_secondary_appointments_list)
        set_selected_secondary_appointment_title(null) // Reset the other search bar
    }

    const onSelectByTitle = (option) => {
        // Necessary because selected_secondary_appointment_vocation_rank is used to set the value of the select box
        set_selected_secondary_appointment_title(option)

        const selected_secondary_appointment = option.value
        let temp_secondary_appointments_list = cloneDeep(secondary_appointments_list)
        temp_secondary_appointments_list.forEach(secondary_appointment => {
            if (secondary_appointment['appointment'] == selected_secondary_appointment ||
                secondary_appointment['previously_saved_appointment'] == selected_secondary_appointment) {
                secondary_appointment['display'] = 'block'
            }
            else {
                secondary_appointment['display'] = 'none'
            }
        })
        set_secondary_appointments_list(temp_secondary_appointments_list)
        set_selected_secondary_appointment_vocation_rank(null) // Reset the other search bar
    }
    // Call this function again every time the page reloads to get the most up to date list of vocation-ranks without templates
    // The page reloads whenever any setState function belonging to the page or its parent is called. 
    var previously_saved_vocation_ranks_without_templates = getVocationRanksWithMissingTemplates(available_vocation_ranks, secondary_appointments_list, "previously_saved_related_vocation_ranks")
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((rank) => {
        return available_vocation_ranks[rank].map(vocation => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))
    let available_secondary_appointment_titles = [].concat(...secondary_appointments_list.map(appointment => [appointment.appointment, appointment.previously_saved_appointment]))
    available_secondary_appointment_titles = [... new Set(available_secondary_appointment_titles)]
    available_secondary_appointment_titles.sort()
    const available_secondary_appointment_options = available_secondary_appointment_titles.map((appointment) => ({ label: appointment, value: appointment }))
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
                            <div className="example-module-title">1. Assigning an Introduction Template to a Vocation-Rank Combination (e.g. Signal Enlistee)</div>
                            <div className="example-module-explanation">Each Vocation-Rank combination (e.g. Signal Specialist, Infantry Officer etc) must have an Introduction Template.</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction template that only applies to Signal Enlistees:</div>
                            <div className="example-module-explanation">All we have to do is click the checkbox that corresponds to Signal Enlistee, fill in the Template box, and click &apos;Save&apos; :)</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">2. Inserting Personal Particulars into an Introduction Template (e.g. Rank and Name)</div>
                            <div className="example-module-explanation">The following Personal Particulars will be collected and can be inserted into all templates:</div>
                            <ol>
                                <li>Rank</li>
                                <li>Full Name</li>
                                <li>Surname</li>
                                <li>Enlistment Date</li>
                                <li>Coy</li>
                                <li>Secondary Appointment</li>
                            </ol>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction template that only applies to all Officers and includes these Personal Particulars.</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Personal Particulars in curly brackets {'{ }'} e.g. {'{Rank}'}.</div>
                        </div>
                    </div>
                </details>
                <details>
                    <summary className="section-summary">Secondary Appointment Templates</summary>
                    <div className="section-group">
                        {Object.entries(available_vocation_ranks).length == 0 &&
                            <div className="missing-vocation-ranks-warning">
                                <div className="missing-vocation-ranks-warning-text">
                                    <div style={{ fontWeight: 'bold', color: 'red', fontSize: "25px" }}>You have not added any relevant vocations & ranks yet!</div>
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>You should add some before adding any {section_name} templates (see the section at the top of the page).</div>
                                </div>
                            </div>
                        }
                        {(Object.entries(previously_saved_vocation_ranks_without_templates).length !== 0 && load_status == 'loaded') &&
                            <div className="missing-vocation-ranks-warning">
                                <div className="missing-vocation-ranks-warning-text">
                                    <div style={{ fontWeight: 'bold', color: 'red', fontSize: "25px" }}>Alert!</div>
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>Although optional, the below mentioned vocation-rank combinations have not been assigned any {section_name} templates</div>
                                </div>
                                <div className="missing-vocation-ranks-group">
                                    {Object.keys(previously_saved_vocation_ranks_without_templates).map((rank_type, i_outer) => {
                                        return (
                                            <div key={i_outer} className="each-missing-rank-group">
                                                <div>{rank_type}</div>
                                                <ul>
                                                    {previously_saved_vocation_ranks_without_templates[rank_type].map((vocation, i_inner) => <li key={i_inner} >{vocation}</li>)}
                                                </ul>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="missing-vocation-ranks-warning-text">
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>You can either create new {section_name} templates for them or assign existing {section_name} templates to them!</div>
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>(Remember to click Save!)</div>
                                </div>
                            </div>
                        }
                        {load_status == 'loaded' && (
                            <div className="search-templates">
                                <Select
                                    className="search-by-title"
                                    onChange={onSelectByTitle}
                                    options={available_secondary_appointment_options}
                                    value={selected_secondary_appointment_title}
                                    placeholder={"Search by Secondary Appointment"}
                                />
                                <Select
                                    className="search-by-vocation-rank"
                                    onChange={onSelectByVocationRank}
                                    options={available_vocation_ranks_options}
                                    value={selected_secondary_appointment_vocation_rank}
                                    placeholder={"Search by Vocation-Rank"}
                                />
                                <button onClick={onViewAll} className={"view-all-button"}>View All</button>
                                <button onClick={onAddSecondaryAppointmentForm} className="add-form-button-right">Add Secondary Appointment</button>
                            </div>
                        )}
                        {load_status == 'loading' && (
                            <p className="loading-text-form-data">Loading...</p>
                        )}
                        {secondary_appointments_list.map((secondary_appointment, form_index) => {
                            return (
                                <SecondaryAppointmentForm
                                    key={secondary_appointment.id}
                                    id={secondary_appointment.id}
                                    appointment={secondary_appointment.appointment}
                                    previously_saved_appointment={secondary_appointment.previously_saved_appointment}
                                    template={secondary_appointment.template}
                                    previously_saved_template={secondary_appointment.previously_saved_template}
                                    transcript_template={secondary_appointment.transcript_template}
                                    previously_saved_transcript_template={secondary_appointment.previously_saved_transcript_template}
                                    related_vocation_ranks={secondary_appointment.related_vocation_ranks}
                                    previously_saved_related_vocation_ranks={secondary_appointment.previously_saved_related_vocation_ranks}
                                    available_vocation_ranks={available_vocation_ranks}
                                    button_state={secondary_appointment.button_state}
                                    display={secondary_appointment.display}
                                    secondary_appointments_list={secondary_appointments_list}
                                    set_secondary_appointments_list={set_secondary_appointments_list}
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

