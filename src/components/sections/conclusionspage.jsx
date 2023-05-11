import { ConclusionForm } from "src/components/forms/conclusionform"
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


    const getVocationRanksTemplateOverview = (available_vocation_ranks, section_list) => {
        // Available vocation ranks is based on forms_list (Vocation-Ranks-Combi) & thus updates when forms_list updates.
        // However, when forms_list is updates, section list (e.g. Introductions_list) is not (designed to persist VRC connections)
        // Therefore, when a vocation or rank is deleted, it will remain in the section list, so optional querying must be employed. (in the .push)        
        let vocation_ranks_template_overview = cloneDeep(available_vocation_ranks)
        Object.keys(vocation_ranks_template_overview).forEach(vocation => {
            const rank_template_entries = vocation_ranks_template_overview[vocation].map(rank => [rank, []])
            vocation_ranks_template_overview[vocation] = Object.fromEntries(rank_template_entries)
        })
        console.log(section_list)
        section_list.forEach(section => {
            const section_related_vocation_ranks = section.previously_saved_related_vocation_ranks
            Object.keys(section_related_vocation_ranks).forEach(vocation => {
                section_related_vocation_ranks[vocation].forEach(rank => {
                    vocation_ranks_template_overview[vocation]?.[rank]?.push("Template Written") // Related vocation may no longer be available
                })
            })
        })
        return vocation_ranks_template_overview
    }

    const getVocationRanksWithTemplates = (available_vocation_ranks, section_list) => {
        const vocation_ranks_with_templates_entries = Object.keys(available_vocation_ranks).map((vocation) => {
            // Generate the missing vocation list based either on saved or unsaved vocation-template assignments. 
            const nested_unsaved_ranks_assigned_templates_list = section_list.map((section) => section["related_vocation_ranks"][vocation])
            const nested_saved_ranks_assigned_templates_list = section_list.map((section) => section["previously_saved_related_vocation_ranks"][vocation])
            const ranks_assigned_templates_list = [].concat(...nested_unsaved_ranks_assigned_templates_list, ...nested_saved_ranks_assigned_templates_list)
            return [vocation, ranks_assigned_templates_list]
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
            related_vocation_ranks: {},
            previously_saved_related_vocation_ranks: {},
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
            if (conclusion["related_vocation_ranks"][selected_vocation]?.includes(selected_rank) ||
                conclusion["previously_saved_related_vocation_ranks"][selected_vocation]?.includes(selected_rank)) {
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
    var vocation_ranks_template_overview = getVocationRanksTemplateOverview(available_vocation_ranks, conclusions_list)
    var vocation_ranks_with_templates = getVocationRanksWithTemplates(available_vocation_ranks, conclusions_list)
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((vocation) => {
        return available_vocation_ranks[vocation].map(rank => `${vocation} ${rank}`)
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
                            <div className="example-module-title" style={{ textDecoration: "underline" }}>Contents</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>1. Assigning a Conclusion to a Vocation-Rank Combination</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>2. Inserting Personal Particulars into a Conclusion Template (e.g. Rank and Name)</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>3. Indicating Where Users Should Manually Insert Character Traits and Examples</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">1. Assigning a Conclusion to a Vocation-Rank Combination</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to add a Conclusion that applies to everyone:</div>
                            <ConclusionForm
                                transcript_template="Conclusion stuff..."
                                template="Conclusion stuff..."
                                related_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                display="block"
                            />
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">2. Inserting Personal Particulars into a Conclusion Template (e.g. Rank and Name)</div>
                            <div className="example-module-explanation">The following Personal Particulars will be collected and can be inserted into all templates:</div>
                            <ol>
                                <li>Rank</li>
                                <li>Full Name</li>
                                <li>Surname</li>
                                <li>Enlistment Date</li>
                                <li>Coy</li>
                                <li>Primary Appointment</li>
                            </ol>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to include these Personal Particulars in our BSOM template.</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Personal Particulars in curly brackets {'{ }'} e.g. {'{Rank}'} (case-insensitive).</div>
                            <ConclusionForm
                                transcript_template="In summary, {rank} {surname} was a valued member of the Battalion and we thank him for his contributions."
                                template="In summary, {rank} {surname} was ... We thank him for his contributions to National Service and wish him the very best for his future endeavours."
                                related_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                display="block"
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Result:</div>
                            <div className="example-module-explanation">In summary, CPL LEK was ... We thank him for his contributions to National Service and wish him the very best for his future endeavours.</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">3. Indicating Where Users Should Manually Insert Character Traits</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want the Testimonial Template to remind users to add a summary of the serviceman&apos;s Character Traits</div>
                            <div className="example-module-explanation">To do so, we need to include {"<Insert Character Trait>"} and {"<Insert specific examplet that demonstrates this trait>"}.</div>
                            <div className="example-module-explanation">Anything wraped in {"<"} and {">"} will be coloured red by the program to catch the user&apos;s attention (Note: It will only be coloured red in the result). </div>
                            <ConclusionForm
                                transcript_template={'In summary, {rank} {surname} was a valued member of the Battalion and we thank him for his contributions.'}
                                template="In summary, {rank} {surname} was <Summarise the character traits you appreciate about him in 2 to 4 sentences>. We thank him for his contributions to National Service and wish him the very best for his future endeavours."
                                related_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                display="block"
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Result:</div>
                            <div className="example-module-explanation" >
                                <span>{"In summary, CPL LEK was "}</span>
                                <span style={{ color: "red" }}>{" <Summarise the character traits you appreciate about him in 2 to 4 sentences>"}</span>                                
                                <span>. We thank him for his contributions to National Service and wish him the very best for his future endeavours.</span>
                            </div>
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
                                                            <ul>
                                                                {vocation_ranks_template_overview[vocation][rank].map((title, i_inner2) => <li style={{color: "green"}} key={i_inner2} >{title}</li>)}
                                                            </ul>
                                                            :
                                                            <ul>
                                                                <li style={{ color: "red" }}>No Template Provided</li>
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

                        {load_status == "loaded" && (
                        <div className="top-bar">                            
                            <div className="search-templates">
                                <Select
                                    className="search-by-vocation-rank"
                                    onChange={onSelectByVocationRank}
                                    options={available_vocation_ranks_options}
                                    value={selected_conclusion_vocation_rank}
                                    placeholder={"Search by Vocation-Rank"}
                                />
                                <button onClick={onViewAll} className={"view-all-button"}>View All</button>
                            </div>
                            <button onClick={onAddConclusionForm} className="add-form-button-right">Add Conclusion</button>                            
                        </div>
                        )}
                        {load_status == "loading" && (
                            <p className="loading-text-form-data">Loading...</p>
                        )}
                        {conclusions_list.map((conclusion, index) => {
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
                                    index={index}
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

