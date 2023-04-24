import { SoldierFundamentalForm } from "src/components/forms/soldierfundamentalform"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import Select from "react-select"
import cloneDeep from 'lodash/cloneDeep';

const valid_ranks = ["Officer", "Specialist", "Enlistee"]

export function SoldierFundamentalsPage({ unit, section_name, available_vocation_ranks, set_dialog_settings }) {

    const [load_status, set_load_status] = useState('loading')
    const [soldier_fundamentals_list, set_soldier_fundamentals_list] = useState([])
    const [selected_soldier_fundamental_vocation_rank, set_selected_soldier_fundamental_vocation_rank] = useState('')
    const [selected_soldier_fundamental_title, set_selected_soldier_fundamental_title] = useState('')

    // Make an API call to obtain the section information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const soldier_fundamentals_response = await fetch(`/api/soldierfundamentals?unit=${unit}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const soldier_fundamentals_response_data = await soldier_fundamentals_response.json()
            set_soldier_fundamentals_list(soldier_fundamentals_response_data.init_list)
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



    const onAddSoldierFundamentalForm = (event) => {
        event.preventDefault()
        set_soldier_fundamentals_list([{
            id: uuidv4(),
            official_name: "",
            previously_saved_official_name: "",
            awards: [''],
            previously_saved_awards: [''],
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
        }, ...cloneDeep(soldier_fundamentals_list)])
    }

    const onViewAll = (event) => {
        event.preventDefault()
        let temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list.forEach(soldier_fundamental => {
            soldier_fundamental['display'] = 'block'
        })
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
        set_selected_soldier_fundamental_vocation_rank(null)
        set_selected_soldier_fundamental_title(null)
    }

    const onSelectByVocationRank = (option) => {
        // Necessary because selected_soldier_fundamental_vocation_rank is used to set the value of the select box
        set_selected_soldier_fundamental_vocation_rank(option)

        const rank_regex_expression = new RegExp(`${valid_ranks.join("|")}$`)
        const selected_rank = option.value.match(rank_regex_expression)[0]
        const selected_vocation = option.value.replace(rank_regex_expression, '').trim()
        let temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list.forEach(soldier_fundamental => {
            if (soldier_fundamental["related_vocation_ranks"][selected_rank]?.includes(selected_vocation) ||
                soldier_fundamental["previously_saved_related_vocation_ranks"][selected_rank]?.includes(selected_vocation)) {
                soldier_fundamental['display'] = 'block'
            }
            else {
                soldier_fundamental['display'] = 'none'
            }
        })
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
        set_selected_soldier_fundamental_title(null) // Reset the other search bar
    }

    const onSelectByTitle = (option) => {
        // Necessary because selected_soldier_fundamental_vocation_rank is used to set the value of the select box
        set_selected_soldier_fundamental_title(option)

        const selected_soldier_fundamental = option.value
        let temp_soldier_fundamentals_list = cloneDeep(soldier_fundamentals_list)
        temp_soldier_fundamentals_list.forEach(soldier_fundamental => {
            if (soldier_fundamental['official_name'] == selected_soldier_fundamental ||
                soldier_fundamental['previously_saved_official_name'] == selected_soldier_fundamental) {
                soldier_fundamental['display'] = 'block'
            }
            else {
                soldier_fundamental['display'] = 'none'
            }
        })
        set_soldier_fundamentals_list(temp_soldier_fundamentals_list)
        set_selected_soldier_fundamental_vocation_rank(null) // Reset the other search bar
    }

    // Call this function again every time the page reloads to get the most up to date list of vocation-ranks without templates
    // The page reloads whenever any setState function belonging to the page or its parent is called. 
    var previously_saved_vocation_ranks_without_templates = getVocationRanksWithMissingTemplates(available_vocation_ranks, soldier_fundamentals_list, "previously_saved_related_vocation_ranks")
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((rank) => {
        return available_vocation_ranks[rank].map(vocation => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))
    let available_soldier_fundamental_titles = [].concat(...soldier_fundamentals_list.map(obj => [obj.official_name, obj.previously_saved_official_name]))
    available_soldier_fundamental_titles = [... new Set(available_soldier_fundamental_titles)]
    available_soldier_fundamental_titles.sort()
    const available_soldier_fundamental_options = available_soldier_fundamental_titles.map((official_name) => ({ label: official_name, value: official_name }))
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
                    <summary className="section-summary">Soldier Fundamental Templates</summary>
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
                                    options={available_soldier_fundamental_options}
                                    value={selected_soldier_fundamental_title}
                                    placeholder={"Search by Soldier Fundamental"}
                                />
                                <Select
                                    className="search-by-vocation-rank"
                                    onChange={onSelectByVocationRank}
                                    options={available_vocation_ranks_options}
                                    value={selected_soldier_fundamental_vocation_rank}
                                    placeholder={"Search by Vocation-Rank"}
                                />
                                <button onClick={onViewAll} className={"view-all-button"}>View All</button>
                                <button onClick={onAddSoldierFundamentalForm} className="add-form-button-right">Add Soldier Fundamental</button>
                            </div>
                        )}
                        {load_status == 'loading' && (
                            <p className="loading-text-form-data">Loading...</p>
                        )}
                        {soldier_fundamentals_list.map((soldier_fundamental, form_index) => {
                            return (
                                <SoldierFundamentalForm
                                    key={soldier_fundamental.id}
                                    id={soldier_fundamental.id}
                                    official_name={soldier_fundamental.official_name}
                                    previously_saved_official_name={soldier_fundamental.previously_saved_official_name}
                                    awards={soldier_fundamental.awards}
                                    previously_saved_awards={soldier_fundamental.previously_saved_awards}
                                    related_vocation_ranks={soldier_fundamental.related_vocation_ranks}
                                    previously_saved_related_vocation_ranks={soldier_fundamental.previously_saved_related_vocation_ranks}
                                    available_vocation_ranks={available_vocation_ranks}
                                    button_state={soldier_fundamental.button_state}
                                    display={soldier_fundamental.display}
                                    soldier_fundamentals_list={soldier_fundamentals_list}
                                    set_soldier_fundamentals_list={set_soldier_fundamentals_list}
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

