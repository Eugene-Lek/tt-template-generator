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
                    vocation_ranks_template_overview[vocation]?.[rank]?.push(section.previously_saved_appointment)
                    vocation_ranks_template_overview[vocation]?.[rank]?.sort() // Sort by alphabetical order                    
                })
            })
        })
        return vocation_ranks_template_overview
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
            related_vocation_ranks: {},
            previously_saved_related_vocation_ranks: {},
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
            if (secondary_appointment["related_vocation_ranks"][selected_vocation]?.includes(selected_rank) ||
                secondary_appointment["previously_saved_related_vocation_ranks"][selected_vocation]?.includes(selected_rank)) {
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
    var vocation_ranks_template_overview = getVocationRanksTemplateOverview(available_vocation_ranks, secondary_appointments_list)
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((vocation) => {
        return available_vocation_ranks[vocation].map(rank => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))
    let available_secondary_appointment_titles = [].concat(...secondary_appointments_list.map(appointment => [appointment.appointment, appointment.previously_saved_appointment]))
    available_secondary_appointment_titles = [... new Set(available_secondary_appointment_titles)].filter(option=>option) // remove empty strings
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
                                                        <div style={{fontWeight: "bold", color: 'black', fontSize: "16px" }}>{vocation} {rank}</div>
                                                        {vocation_ranks_template_overview[vocation][rank].length > 0 ?
                                                            <ol>
                                                                {vocation_ranks_template_overview[vocation][rank].map((title, i_inner2) => <li key={i_inner2} >{title}</li>)}
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
                            </div>
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

