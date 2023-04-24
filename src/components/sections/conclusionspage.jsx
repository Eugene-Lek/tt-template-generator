import { ConclusionForm } from "src/components/forms/conclusionform"
import { PreUnitAchievementForm } from "src/components/forms/preunitachievementform"
import { useEffect, useState } from "react"
import Select from "react-select"
import { v4 as uuidv4 } from "uuid"
import cloneDeep from "lodash/cloneDeep";

const valid_ranks = ["Officer", "Specialist", "Enlistee"]

export function ConclusionsPage({ unit, section_name, available_vocation_ranks, set_dialog_settings }) {

    const [load_status, set_load_status] = useState("loading")
    const [conclusions_list, set_conclusions_list] = useState([])
    const [selected_conclusion_vocation_rank, set_selected_conclusion_vocation_rank] = useState("")

    // Make an API call to obtain the conclusion information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const conclusions_response = await fetch(`/api/conclusions?unit=${unit}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            const conclusions_response_data = await conclusions_response.json()
            set_conclusions_list(conclusions_response_data.init_conclusions_list)
            set_load_status("loaded")
        }
        fetchSectionData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const getVocationRanksWithTemplates = (available_vocation_ranks, section_list) => {
        const vocation_ranks_with_templates_entries = Object.keys(available_vocation_ranks).map((rank_type) => {
            // Generate the missing vocation list based either on saved or unsaved vocation-template assignments. 
            const nested_unsaved_vocations_assigned_templates_list = section_list.map((section) => section["related_vocation_ranks"][rank_type])
            const nested_saved_vocations_assigned_templates_list = section_list.map((section) => section["previously_saved_related_vocation_ranks"][rank_type])
            const vocations_assigned_templates_list = [].concat(...nested_unsaved_vocations_assigned_templates_list, ...nested_saved_vocations_assigned_templates_list)
            return [rank_type, vocations_assigned_templates_list]
        })
        const vocation_ranks_with_templates = Object.fromEntries(vocation_ranks_with_templates_entries) // Remove undefined elements due to no missing vocations for a particular rank
        return vocation_ranks_with_templates
    }

    const onAddConclusionForm = (event) => {
        event.preventDefault()
        set_conclusions_list([{
            id: uuidv4(),
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
        }, ...cloneDeep(conclusions_list)])
    }

    const onViewAll = (event) => {
        event.preventDefault()
        let temp_conclusions_list = cloneDeep(conclusions_list)
        temp_conclusions_list.forEach(conclusion => {
            conclusion["display"] = "block"
        })
        set_conclusions_list(temp_conclusions_list)
        set_selected_conclusion_vocation_rank(null)
    }

    const onSelectByVocationRank = (option) => {
        // Necessary because selected_conclusion_vocation_rank is used to set the value of the select box
        set_selected_conclusion_vocation_rank(option)

        const rank_regex_expression = new RegExp(`${valid_ranks.join("|")}$`)
        const selected_rank = option.value.match(rank_regex_expression)[0]
        const selected_vocation = option.value.replace(rank_regex_expression, "").trim()
        let temp_conclusions_list = cloneDeep(conclusions_list)
        temp_conclusions_list.forEach(conclusion => {
            if (conclusion["related_vocation_ranks"][selected_rank]?.includes(selected_vocation) ||
                conclusion["previously_saved_related_vocation_ranks"][selected_rank]?.includes(selected_vocation)) {
                conclusion["display"] = "block"
            }
            else {
                conclusion["display"] = "none"
            }
        })
        set_conclusions_list(temp_conclusions_list)
    }


    // Call this function again every time the page reloads to get the most up to date list of vocation-ranks without templates
    // The page reloads whenever any setState function belonging to the page or its parent is called. 
    var previously_saved_vocation_ranks_without_templates = getVocationRanksWithMissingTemplates(available_vocation_ranks, conclusions_list, "previously_saved_related_vocation_ranks")
    var vocation_ranks_with_templates = getVocationRanksWithTemplates(available_vocation_ranks, conclusions_list)
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((rank) => {
        return available_vocation_ranks[rank].map(vocation => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))

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
                            <div className="example-module-title">1. Assigning an Conclusion Template to a Vocation-Rank Combination (e.g. Signal Enlistee)</div>
                            <div className="example-module-explanation">Each Vocation-Rank combination (e.g. Signal Specialist, Infantry Officer etc) must have an Conclusion Template.</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>Let&apos;s say we want to write an Conclusion template that only applies to Signal Enlistees:</div>
                            <ConclusionForm
                                template="Blah Blah Blah Blah Signals Institute Blah Blah Blah Signal Operator Blah Blah Blah"
                                related_vocation_ranks={{ "Enlistee": ["Signals"] }}
                                available_vocation_ranks={{ "Officer": ["Signals", "Combat Engineers"], "Specialist": ["Signals", "Combat Engineers"], "Enlistee": ["Signals", "Combat Engineers"] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                            />
                            <div className="example-module-explanation">All we have to do is click the checkbox that corresponds to Signal Enlistee, fill in the Template box, and click &apos;Save&apos; :)</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">2. Inserting Personal Particulars into an Conclusion Template (e.g. Rank and Name)</div>
                            <div className="example-module-explanation">The following Personal Particulars will be collected and can be inserted into all templates:</div>
                            <ol>
                                <li>Rank</li>
                                <li>Full Name</li>
                                <li>Surname</li>
                                <li>Enlistment Date</li>
                                <li>Coy</li>
                                <li>Primary Appointment</li>
                            </ol>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>Let&apos;s say we want to write an Conclusion template that only applies to all Officers and includes these Personal Particulars.</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Personal Particulars in curly brackets {"{ }"} e.g. {"{Rank}"}.</div>
                            <ConclusionForm
                                template="{Rank} {Full Name} enlisted in the Singapore Armed Forces on {Enlistment Date}. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. Upon commissioning, {Rank} {Surname} was posted to {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of {Primary Appointment}."
                                related_vocation_ranks={{ "Officer": ["Signals", "Combat Engineers"] }}
                                available_vocation_ranks={{ "Officer": ["Signals", "Combat Engineers"], "Specialist": ["Signals", "Combat Engineers"], "Enlistee": ["Signals", "Combat Engineers"] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                            />
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">3. Inserting Pre-Unit Achievements (Optional)</div>
                            <div className="example-module-explanation">By default, the following Pre-Unit Achievements can be selected by users if they apply to the servicemen and can be inserted into Conclusion templates:</div>
                            <ol>
                                <li>Sword of Honour</li>
                                <li>Sword of Merit</li>
                                <li>Golden Bayonet</li>
                                <li>Silver Bayonet</li>
                                <li>BMT Best Recruit</li>
                            </ol>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>For example, these are the default settings for &apos;Sword of Honour&apos; and &apos;Sword of Merit&apos;:</div>
                            <PreUnitAchievementForm
                                achievement_title={"Sword of Honour"}
                                achievement_wording={"To this end, {Rank} {Surname} performed the best among his peers and graduated with a Sword of Honour (Top Performer)."}
                                button_state={"save"}
                                permanently_disable_edit
                            />
                            <PreUnitAchievementForm
                                achievement_title={"Sword of Merit"}
                                achievement_wording={"To this end, {rank} {surname} performed well and graduated with a Sword of Merit (Top 10%)."}
                                button_state={"save"}
                                permanently_disable_edit
                            />
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>Let&apos;s say we want to write an Conclusion template that only applies to all Officers and includes these 2 Pre-Unit Achievements (if they are selected by the user).</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Pre-Unit Achievements in curly brackets {"{ }"} e.g. {"{Sword of Honour}"}.</div>
                            <ConclusionForm
                                template="{Rank} {Full Name} enlisted in the Singapore Armed Forces on {Enlistment Date}. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. {Sword of Honour} {Sword of Merit} Upon commissioning, {Rank} {Surname} was posted to {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of {Primary Appointment}."
                                related_vocation_ranks={{ "Officer": ["Signals", "Combat Engineers"] }}
                                available_vocation_ranks={{ "Officer": ["Signals", "Combat Engineers"], "Specialist": ["Signals", "Combat Engineers"], "Enlistee": ["Signals", "Combat Engineers"] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                            />
                            <div className="example-module-explanation" style={{ fontWeight: "bold", textDecoration: "underline" }}>Important Note:</div>
                            <div className="example-module-explanation">If a Pre-Unit Achievement is included in the template but is not selected by the user, it will not be part of the result. (examples below)</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>1. No Pre-Unit Achievements Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. Upon commissioning, LTA LOKE was posted to &apos;A&apos; Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>2. &apos;Sword of Honour&apos; Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. To this end, LTA LOKE performed the best among his peers and graduated with a Sword of Honour (Top Performer). Upon commissioning, LTA LOKE was posted to &apos;A&apos; Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>3. &apos;Sword of Merit&apos; Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. To this end, LTA LOKE performed well and graduated with a Sword of Merit (Top 10%). Upon commissioning, LTA LOKE was posted to &apos;A&apos; Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
                        </div>
                    </div>
                </details>
                <details>
                    <summary className="section-summary">Conclusion Templates</summary>
                    <div className="section-group">
                        {Object.entries(available_vocation_ranks).length == 0 &&
                            <div className="missing-vocation-ranks-warning">
                                <div className="missing-vocation-ranks-warning-text">
                                    <div style={{ fontWeight: "bold", color: "red", fontSize: "25px" }}>You have not added any relevant vocations & ranks yet!</div>
                                    <div style={{ fontWeight: "bold", color: "black", fontSize: "15px" }}>You should add some before adding any {section_name} templates (see the section at the top of the page).</div>
                                </div>
                            </div>
                        }
                        {(Object.entries(previously_saved_vocation_ranks_without_templates).length !== 0 && load_status == "loaded") &&
                            <div className="missing-vocation-ranks-warning">
                                <div className="missing-vocation-ranks-warning-text">
                                    <div style={{ fontWeight: "bold", color: "red", fontSize: "25px" }}>Alert!</div>
                                    <div style={{ fontWeight: "bold", color: "black", fontSize: "15px" }}>The below mentioned vocation-rank combinations have not been assigned any {section_name} templates :(</div>
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
                                    <div style={{ fontWeight: "bold", color: "black", fontSize: "15px" }}>You can either create new Conclusion templates for them or assign existing Conclusion templates to them!</div>
                                    <div style={{ fontWeight: "bold", color: "black", fontSize: "15px" }}>(Remember to click Save!)</div>
                                </div>
                            </div>
                        }
                        {load_status == "loaded" && (
                            <div className="search-templates">
                                <Select
                                    className="search-by-vocation-rank"
                                    onChange={onSelectByVocationRank}
                                    options={available_vocation_ranks_options}
                                    value={selected_conclusion_vocation_rank}
                                    placeholder={"Search by Vocation-Rank"}
                                />
                                <button onClick={onViewAll} className={"view-all-button"}>View All</button>
                                <button onClick={onAddConclusionForm} className="add-form-button-right">Add Conclusion</button>
                            </div>
                        )}
                        {load_status == "loading" && (
                            <p className="loading-text-form-data">Loading...</p>
                        )}
                        {conclusions_list.map((conclusion, intro_index) => {
                            return (
                                <ConclusionForm
                                    key={conclusion.id}
                                    id={conclusion.id}
                                    template={conclusion.template}
                                    previously_saved_template={conclusion.previously_saved_template}
                                    transcript_template={conclusion.transcript_template}
                                    previously_saved_transcript_template={conclusion.previously_saved_transcript_template}
                                    related_vocation_ranks={conclusion.related_vocation_ranks}
                                    previously_saved_related_vocation_ranks={conclusion.previously_saved_related_vocation_ranks}
                                    available_vocation_ranks={available_vocation_ranks}
                                    vocation_ranks_with_templates={vocation_ranks_with_templates}
                                    button_state={conclusion.button_state}
                                    display={conclusion.display}
                                    conclusions_list={conclusions_list}
                                    set_conclusions_list={set_conclusions_list}
                                    intro_index={intro_index}
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

