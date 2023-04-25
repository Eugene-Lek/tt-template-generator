import { OtherIndividualAchievementForm } from "src/components/forms/otherindividualachievementform"
import { useEffect, useState } from "react"
import Select from "react-select";
import { v4 as uuidv4 } from "uuid"
import cloneDeep from 'lodash/cloneDeep';

const valid_ranks = ["Officer", "Specialist", "Enlistee"]

export function OtherIndividualAchievementsPage({ unit, section_name, available_vocation_ranks, set_dialog_settings }) {

    const [load_status, set_load_status] = useState('loading')
    const [other_individual_achievements_list, set_other_individual_achievements_list] = useState([])
    const [selected_other_individual_achievement_vocation_rank, set_selected_other_individual_achievement_vocation_rank] = useState('')
    const [selected_other_individual_achievement_title, set_selected_other_individual_achievement_title] = useState('')

    // Make an API call to obtain the section information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const other_individual_achievements_response = await fetch(`/api/otherindividualachievements?unit=${unit}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const other_individual_achievements_response_data = await other_individual_achievements_response.json()
            console.log(other_individual_achievements_response_data.init_list)
            set_other_individual_achievements_list(other_individual_achievements_response_data.init_list)
            set_load_status('loaded')
        }
        fetchSectionData()

    }, [unit])


    const getVocationRanksWithMissingTemplates = (available_vocation_ranks, section_list) => {
        const vocation_ranks_without_templates_entries = Object.keys(available_vocation_ranks).map((vocation) => {
            // Generate the missing vocation list based either on saved or unsaved vocation-template assignments. 
            const nested_ranks_assigned_templates_list = section_list.map((section) => section["previously_saved_related_vocation_ranks"][vocation])
            const ranks_assigned_templates_list = [].concat(...nested_ranks_assigned_templates_list)
            const missing_ranks_list = available_vocation_ranks[vocation].filter((rank) => !ranks_assigned_templates_list.includes(rank))
            if (missing_ranks_list.length == 0) {
                // Return nothing due to no missing vocations for a particular rank
                return
            }
            return [vocation, missing_ranks_list]
        })
        const vocation_ranks_without_templates = Object.fromEntries(vocation_ranks_without_templates_entries.filter((element) => element)) // Remove undefined elements due to no missing vocations for a particular rank
        return vocation_ranks_without_templates
    }



    const onAddOtherIndividualAchievementForm = (event) => {
        event.preventDefault()
        set_other_individual_achievements_list([{
            id: uuidv4(),
            achievement: "",
            previously_saved_achievement: "",
            template: "",
            previously_saved_template: "",
            transcript_template: "",
            previously_saved_transcript_template: "",
            related_vocation_ranks: {},
            previously_saved_related_vocation_ranks: {},
            button_state: "save"
        }, ...cloneDeep(other_individual_achievements_list)])
    }

    const onViewAll = (event) => {
        event.preventDefault()
        let temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)
        temp_other_individual_achievements_list.forEach(other_individual_achievement => {
            other_individual_achievement['display'] = 'block'
        })
        set_other_individual_achievements_list(temp_other_individual_achievements_list)
        set_selected_other_individual_achievement_vocation_rank(null)
        set_selected_other_individual_achievement_title(null)
    }

    const onSelectByVocationRank = (option) => {
        // Necessary because selected_other_individual_achievement_vocation_rank is used to set the value of the select box
        set_selected_other_individual_achievement_vocation_rank(option)

        const rank_regex_expression = new RegExp(`${valid_ranks.join("|")}$`)
        const selected_rank = option.value.match(rank_regex_expression)[0]
        const selected_vocation = option.value.replace(rank_regex_expression, '').trim()
        let temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)
        temp_other_individual_achievements_list.forEach(other_individual_achievement => {
            if (other_individual_achievement["related_vocation_ranks"][selected_vocation]?.includes(selected_rank) ||
                other_individual_achievement["previously_saved_related_vocation_ranks"][selected_vocation]?.includes(selected_rank)) {
                other_individual_achievement['display'] = 'block'
            }
            else {
                other_individual_achievement['display'] = 'none'
            }
        })
        set_other_individual_achievements_list(temp_other_individual_achievements_list)
        set_selected_other_individual_achievement_title(null) // Reset the other search bar
    }

    const onSelectByTitle = (option) => {
        // Necessary because selected_other_individual_achievement_vocation_rank is used to set the value of the select box
        set_selected_other_individual_achievement_title(option)

        const selected_other_individual_achievement = option.value
        let temp_other_individual_achievements_list = cloneDeep(other_individual_achievements_list)
        temp_other_individual_achievements_list.forEach(other_individual_achievement => {
            if (other_individual_achievement['achievement'] == selected_other_individual_achievement ||
                other_individual_achievement['previously_saved_achievement'] == selected_other_individual_achievement) {
                other_individual_achievement['display'] = 'block'
            }
            else {
                other_individual_achievement['display'] = 'none'
            }
        })
        set_other_individual_achievements_list(temp_other_individual_achievements_list)
        set_selected_other_individual_achievement_vocation_rank(null) // Reset the other search bar
    }

    // Call this function again every time the page reloads to get the most up to date list of vocation-ranks without templates
    // The page reloads whenever any setState function belonging to the page or its parent is called. 
    var previously_saved_vocation_ranks_without_templates = getVocationRanksWithMissingTemplates(available_vocation_ranks, other_individual_achievements_list)
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((vocation) => {
        return available_vocation_ranks[vocation].map(rank => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))
    let available_other_individual_achievement_titles = [].concat(...other_individual_achievements_list.map(obj => [obj.achievement, obj.previously_saved_achievement]))
    available_other_individual_achievement_titles = [... new Set(available_other_individual_achievement_titles)].filter(option=>option) // remove empty strings
    available_other_individual_achievement_titles.sort()
    const available_other_individual_achievement_options = available_other_individual_achievement_titles.map((achievement) => ({ label: achievement, value: achievement }))

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
                    <summary className="section-summary">Other Individual Achievement Templates</summary>
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
                                    {Object.keys(previously_saved_vocation_ranks_without_templates).map((vocation, i_outer) => {
                                        return (
                                            <div key={i_outer} className="each-missing-rank-group">
                                                <div>{vocation}</div>
                                                <ul>
                                                    {previously_saved_vocation_ranks_without_templates[vocation].map((rank, i_inner) => <li key={i_inner} >{rank}</li>)}
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
                                    options={available_other_individual_achievement_options}
                                    value={selected_other_individual_achievement_title}
                                    placeholder={"Search by Achievement"}
                                />
                                <Select
                                    className="search-by-vocation-rank"
                                    onChange={onSelectByVocationRank}
                                    options={available_vocation_ranks_options}
                                    value={selected_other_individual_achievement_vocation_rank}
                                    placeholder={"Search by Vocation-Rank"}
                                />
                                <button onClick={onViewAll} className={"view-all-button"}>View All</button>
                                <button onClick={onAddOtherIndividualAchievementForm} className="add-form-button-right">Add Other Individual Achievement</button>
                            </div>
                        )}

                        {load_status == 'loading' && (
                            <p className="loading-text-form-data">Loading...</p>
                        )}
                        {other_individual_achievements_list.map((other_individual_achievement, form_index) => {
                            return (
                                <OtherIndividualAchievementForm
                                    key={other_individual_achievement.id}
                                    id={other_individual_achievement.id}
                                    achievement={other_individual_achievement.achievement}
                                    previously_saved_achievement={other_individual_achievement.previously_saved_achievement}
                                    template={other_individual_achievement.template}
                                    previously_saved_template={other_individual_achievement.previously_saved_template}
                                    transcript_template={other_individual_achievement.transcript_template}
                                    previously_saved_transcript_template={other_individual_achievement.previously_saved_transcript_template}
                                    related_vocation_ranks={other_individual_achievement.related_vocation_ranks}
                                    previously_saved_related_vocation_ranks={other_individual_achievement.previously_saved_related_vocation_ranks}
                                    available_vocation_ranks={available_vocation_ranks}
                                    button_state={other_individual_achievement.button_state}
                                    display={other_individual_achievement.display}
                                    other_individual_achievements_list={other_individual_achievements_list}
                                    set_other_individual_achievements_list={set_other_individual_achievements_list}
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

