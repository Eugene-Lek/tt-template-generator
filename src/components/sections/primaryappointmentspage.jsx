import { PrimaryAppointmentForm } from "src/components/forms/primaryappointmentform"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import Select from "react-select"
import cloneDeep from 'lodash/cloneDeep';

const valid_ranks = ["Officer", "Specialist", "Enlistee"]

export function PrimaryAppointmentsPage({ unit, section_name, available_vocation_ranks, set_dialog_settings }) {

    const [load_status, set_load_status] = useState('loading')
    const [primary_appointments_list, set_primary_appointments_list] = useState([])
    const [selected_primary_appointment_vocation_rank, set_selected_primary_appointment_vocation_rank] = useState('')
    const [selected_primary_appointment_title, set_selected_primary_appointment_title] = useState('')

    // Make an API call to obtain the section information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const primary_appointments_response = await fetch(`/api/primaryappointments?unit=${unit}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const primary_appointments_response_data = await primary_appointments_response.json()
            set_primary_appointments_list(primary_appointments_response_data.init_list)
            set_load_status('loaded')
        }
        fetchSectionData()

    }, [])


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

    const onAddPrimaryAppointmentForm = (event) => {
        event.preventDefault()
        set_primary_appointments_list([{
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
            if (primary_appointment["related_vocation_ranks"][selected_rank]?.includes(selected_vocation) ||
                primary_appointment["previously_saved_related_vocation_ranks"][selected_rank]?.includes(selected_vocation)) {
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
    var previously_saved_vocation_ranks_without_templates = getVocationRanksWithMissingTemplates(available_vocation_ranks, primary_appointments_list, "previously_saved_related_vocation_ranks")
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((rank) => {
        return available_vocation_ranks[rank].map(vocation => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))
    let available_primary_appointment_titles = [].concat(...primary_appointments_list.map(appointment => [appointment.appointment, appointment.previously_saved_appointment]))
    available_primary_appointment_titles = [... new Set(available_primary_appointment_titles)]
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
                            <div className="example-module-title">1. Assigning an Introduction Template to a Vocation-Rank Combination (e.g. Signal Enlistee)</div>
                            <div className="example-module-explanation">Each Vocation-Rank combination (e.g. Signal Specialist, Infantry Officer etc) must have an Introduction Template.</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let's say we want to write an Introduction template that only applies to Signal Enlistees:</div>
                            <div className="example-module-explanation">All we have to do is click the checkbox that corresponds to Signal Enlistee, fill in the Template box, and click 'Save' :)</div>
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
                                <li>Primary Appointment</li>
                            </ol>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let's say we want to write an Introduction template that only applies to all Officers and includes these Personal Particulars.</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Personal Particulars in curly brackets {'{ }'} e.g. {'{Rank}'}.</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">3. Inserting Pre-Unit Achievements (Optional)</div>
                            <div className="example-module-explanation">By default, the following Pre-Unit Achievements can be selected by users if they apply to the servicemen and can be inserted into Introduction templates:</div>
                            <ol>
                                <li>Sword of Honour</li>
                                <li>Sword of Merit</li>
                                <li>Golden Bayonet</li>
                                <li>Silver Bayonet</li>
                                <li>BMT Best Recruit</li>
                            </ol>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>For example, these are the default settings for 'Sword of Honour' and 'Sword of Merit':</div>

                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let's say we want to write an Introduction template that only applies to all Officers and includes these 2 Pre-Unit Achievements (if they are selected by the user).</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Pre-Unit Achievements in curly brackets {'{ }'} e.g. {'{Sword of Honour}'}.</div>

                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Important Note:</div>
                            <div className="example-module-explanation">If a Pre-Unit Achievement is included in the template but is not selected by the user, it will not be part of the result. (examples below)</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>1. No Pre-Unit Achievements Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. Upon commissioning, LTA LOKE was posted to 'A' Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>2. 'Sword of Honour' Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. To this end, LTA LOKE performed the best among his peers and graduated with a Sword of Honour (Top Performer). Upon commissioning, LTA LOKE was posted to 'A' Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>3. 'Sword of Merit' Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. To this end, LTA LOKE performed well and graduated with a Sword of Merit (Top 10%). Upon commissioning, LTA LOKE was posted to 'A' Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
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
                        {(Object.entries(previously_saved_vocation_ranks_without_templates).length !== 0  && load_status == 'loaded') && 
                            <div className="missing-vocation-ranks-warning">
                                <div className="missing-vocation-ranks-warning-text">
                                    <div style={{ fontWeight: 'bold', color: 'red', fontSize: "25px" }}>Alert!</div>
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>The below mentioned vocation-rank combinations have not been assigned any {section_name} templates :(</div>
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

