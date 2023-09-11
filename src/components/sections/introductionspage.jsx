import { IntroductionForm } from "src/components/forms/introductionform"
import { PreUnitAchievementForm } from "src/components/forms/preunitachievementform"
import Select from "react-select"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import cloneDeep from 'lodash/cloneDeep';

const valid_ranks = ["Officer", "Specialist", "Enlistee"]

export function IntroductionsPage({ unit, section_name, available_vocation_ranks, set_dialog_settings, savedPersonalParticularsFields }) {

    const [load_status_introduction, set_load_status_introduction] = useState('loading')
    const [load_status_pre_unit_achievement, set_load_status_pre_unit_achievement] = useState('loading')
    const [introductions_list, set_introductions_list] = useState([])
    const [pre_unit_achievements_list, set_pre_unit_achievements_list] = useState([])
    const [selected_introduction_vocation_rank, set_selected_introduction_vocation_rank] = useState('')
    const [selected_pre_unit_achievement_title, set_selected_pre_unit_achievement_title] = useState('')

    // Make an API call to obtain the introduction information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const introductions_response = await fetch(`/api/introductions?unit=${unit}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const introductions_response_data = await introductions_response.json()
            const init_introductions_list = introductions_response_data.init_introductions_list
            // Maintain the hidden state of forms. This means newly added but unsaved forms will remain displayed
            const init_introductions_dict = Object.fromEntries(init_introductions_list.map(obj => [obj.id, obj]))
            let temp_introductions_list = cloneDeep(introductions_list)
            temp_introductions_list = temp_introductions_list.map(obj => {
                if (obj.button_state == "save") {
                    // If there are any unsaved changes, DO NOT replace the form's data with the one from the database!
                    // Instead, keep the existing form data on the client side. (including the display state)
                    return obj
                }                
                const live_display_state = obj.display
                if (init_introductions_dict.hasOwnProperty(obj.id)) {
                    obj = init_introductions_dict[obj.id]
                    obj.display = live_display_state // Keep the display up to date. a.k.a. do not let it return to the default 'block'
                }
                return obj
            })
            // Add introductions that were added to the database but not the introductions list (client-side)
            // (a.k.a. added via another device after the page of this device was loaded)
            const forms_filtered = init_introductions_list.some(obj => obj.display == "none")
            const existing_client_forms_ids = temp_introductions_list.map(obj => obj.id)
            init_introductions_list.forEach(obj => {
                if (!existing_client_forms_ids.includes(obj.id)) {
                    obj.display = forms_filtered ? 'none' : 'block' // Hide if the forms are filtered on the client side
                    temp_introductions_list.push(obj)
                }
            })
            set_introductions_list(temp_introductions_list)
            set_load_status_introduction('loaded')
        }
        fetchSectionData()

    }, [unit, pre_unit_achievements_list.map(obj => obj.previously_saved_achievement_title).join(), savedPersonalParticularsFields])
    // ^Only reload the Introductions data when any of the pre_unit_achievement titles have been changed and saved
    // Note: This works by setting the dependency with a string of all the previously_saved_pre_unit_achievements combined
    // This way, the string and thus the dependency will change whenever a change is made and saved to any of the pre unit achievement titles.



    // Make an API call to obtain the pre-unit achievement information.

    useEffect(() => {
        const fetchSectionData = async () => {
            const pre_unit_achievements_response = await fetch(`/api/pre-unit-achievements?unit=${unit}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const pre_unit_achievements_response_data = await pre_unit_achievements_response.json()
            set_pre_unit_achievements_list(pre_unit_achievements_response_data.init_list)
            set_load_status_pre_unit_achievement('loaded')
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
                    vocation_ranks_template_overview[vocation]?.[rank]?.push({ title: "Template Written", achievements: section.previously_saved_pre_unit_achievements.sort() }) // Related vocation may no longer be available
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

    const onViewAllIntroduction = (event) => {
        event.preventDefault()
        let temp_introductions_list = cloneDeep(introductions_list)
        temp_introductions_list.forEach(introduction => {
            introduction['display'] = 'block'
        })
        set_introductions_list(temp_introductions_list)
        set_selected_introduction_vocation_rank(null)
    }

    const onSelectIntroductionByVocationRank = (option) => {
        // Necessary because selected_introduction_vocation_rank is used to set the value of the select box
        set_selected_introduction_vocation_rank(option)
        const rank_regex_expression = new RegExp(`${valid_ranks.join("|")}$`)
        const selected_rank = option.value.match(rank_regex_expression)[0]
        const selected_vocation = option.value.replace(rank_regex_expression, '').trim()
        let temp_introductions_list = cloneDeep(introductions_list)
        temp_introductions_list.forEach(introduction => {
            if (introduction["related_vocation_ranks"][selected_vocation]?.includes(selected_rank) ||
                introduction["previously_saved_related_vocation_ranks"][selected_vocation]?.includes(selected_rank)) {
                introduction['display'] = 'block'
            }
            else {
                introduction['display'] = 'none'
            }
        })
        set_introductions_list(temp_introductions_list)

    }

    const onViewAllPreUnitAchievement = (event) => {
        event.preventDefault()
        let temp_pre_unit_achievements_list = cloneDeep(pre_unit_achievements_list)
        temp_pre_unit_achievements_list.forEach(pre_unit_achievement => {
            pre_unit_achievement['display'] = 'block'
        })
        set_pre_unit_achievements_list(temp_pre_unit_achievements_list)
        set_selected_pre_unit_achievement_title(null)
    }

    const onSelectPreUnitAppointmentByTitle = (option) => {
        // Necessary because selected_introduction_vocation_rank is used to set the value of the select box
        set_selected_pre_unit_achievement_title(option)

        const selected_pre_unit_achievement = option.value
        let temp_pre_unit_achievements_list = cloneDeep(pre_unit_achievements_list)
        temp_pre_unit_achievements_list.forEach(pre_unit_achievement => {
            if (pre_unit_achievement['achievement_title'] == selected_pre_unit_achievement ||
                pre_unit_achievement['previously_saved_achievement_title'] == selected_pre_unit_achievement) {
                pre_unit_achievement['display'] = 'block'
            }
            else {
                pre_unit_achievement['display'] = 'none'
            }
        })
        set_pre_unit_achievements_list(temp_pre_unit_achievements_list)

    }

    const onAddIntroductionForm = (event) => {
        event.preventDefault()
        set_introductions_list([{
            id: uuidv4(),
            template: "",
            previously_saved_template: "",
            transcript_template: "",
            previously_saved_transcript_template: "",
            related_vocation_ranks: {},
            previously_saved_related_vocation_ranks: {},
            previously_saved_pre_unit_achievements: [],
            button_state: "save"
        }, ...cloneDeep(introductions_list)])
    }


    const onAddPreUnitAchievementForm = (event) => {
        event.preventDefault()
        set_pre_unit_achievements_list([{
            id: uuidv4(),
            achievement_title: '',
            previously_saved_achievement_title: '',
            achievement_wording: '',
            previously_saved_achievement_wording: '',
            button_state: "save"
        }, ...cloneDeep(pre_unit_achievements_list)])
    }


    // Call this function again every time the page reloads to get the most up to date list of vocation-ranks without templates
    // The page reloads whenever any setState function belonging to the page or its parent is called. 
    var vocation_ranks_template_overview = getVocationRanksTemplateOverview(available_vocation_ranks, introductions_list)
    var vocation_ranks_with_templates = getVocationRanksWithTemplates(available_vocation_ranks, introductions_list)
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((vocation) => {
        return available_vocation_ranks[vocation].map(rank => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))
    let available_pre_unit_achievement_titles = [].concat(...pre_unit_achievements_list.map(achievement => [achievement.achievement_title, achievement.previously_saved_achievement_title]))
    available_pre_unit_achievement_titles = [... new Set(available_pre_unit_achievement_titles)].filter(option => option) // remove empty strings
    available_pre_unit_achievement_titles.sort()
    const available_pre_unit_achievement_options = available_pre_unit_achievement_titles.map((achievement) => ({ label: achievement, value: achievement }))
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
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>1. Assigning an Introduction Template to a Vocation-Rank Combination (e.g. Signal Enlistee)</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>2. Inserting Personal Particulars into an Introduction Template (e.g. Rank and Name)</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>3. Indicating Where Users Should Manually Insert Personal Elements</div>
                            <div className="example-module-explanation" style={{ fontWeight: "bold" }}>4. Inserting Pre-Unit Achievements (Optional)</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">1. Assigning an Introduction Template to a Vocation-Rank Combination (e.g. Signal Enlistee)</div>
                            <div className="example-module-explanation">Each Vocation-Rank combination (e.g. Signal Specialist, Infantry Officer etc) must have an Introduction Template.</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction template that only applies to Signal Enlistees:</div>
                            <IntroductionForm
                                transcript_template="... 30th Battalion, Singapore Combat Engineers ... Signal Operator"
                                template="... Basic Military Training. ... Signals Institute. ... 30th Battalion, Singapore Combat Engineers, ... Signal Operator "
                                related_vocation_ranks={{ 'Signals': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                display="block"
                            />
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
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction template that applies to all Specialists and includes these Personal Particulars.</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Personal Particulars in curly brackets {'{ }'} e.g. {'{Rank}'} (case-insensitive).</div>
                            <IntroductionForm
                                transcript_template={'{Rank} {Full Name} served as a {Primary Appointment} in {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE).'}
                                template="{Rank} {Full Name} enlisted in the Singapore Armed Forces on {Enlistment Date}. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Specialist Cadet Course. Subsequently, {Rank} {Surname} was posted to {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE) where he was assigned the role of {Primary Appointment}."
                                related_vocation_ranks={{ 'Signals': ['Specialist'], 'Combat Engineers': ['Specialist'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                display="block"
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Result:</div>
                            <div className="example-module-explanation">3SG ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Specialist Cadet Course. Subsequently, 3SG LOKE was posted to &apos;A&apos; Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Section Commander.</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">3. Indicating Where Users Should Manually Insert Personal Elements</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction Template for ASAs who OOC-ed from their original vocational course due to an injury.</div>
                            <div className="example-module-explanation">To indicate where users should manually insert the physical injury that the serviceman had suffered from, we need to include {"<Insert Physical Injury>"}.</div>
                            <div className="example-module-explanation">Anything wraped in {"<"} and {">"} will be coloured red by the program to catch the user&apos;s attention (Note: It will only be coloured red in the result). </div>
                            <IntroductionForm
                                transcript_template={'{Rank} {Full Name} served as a {Primary Appointment} in {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE).'}
                                template="{Rank} {Full Name} enlisted in the Singapore Armed Forces on {Enlistment Date}. Upon completion of his Basic Military Training, he was posted to <Insert Original Company> Company, 30th Battalion, Singapore Combat Engineers (30SCE) to serve as a Field Engineer Pioneer. Unfortunately, {Rank} {Surname} ended up suffering from <Insert Physical Injury> and could no longer participate in outfield training or physical activities. After his medical status had been re-evaluated, {Rank} {Surname} was re-deployed to the <Insert New Coy (e.g. Battalion HQ) Or New Platoon (e.g. 'A' Company HQ)> as a <Insert Clerk Appointment (e.g. Finance Clerk)>."
                                related_vocation_ranks={{ 'Admin': ['Enlistee'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                                display="block"
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Result:</div>
                            <div className="example-module-explanation" >
                                <span>{"LCP ADRIAN TEO enlisted in the Singapore Armed Forces on 28 March 2021. Upon completion of his Basic Military Training, he was posted to "}</span>
                                <span style={{ color: "red" }}>{"<Insert Original Company>"}</span>
                                <span>{" Company, 30th Battalion, Singapore Combat Engineers (30SCE) to serve as a Field Engineer Pioneer. Unfortunately, LCP TEO ended up suffering from "}</span>
                                <span style={{ color: "red" }}>{"<Insert Physical Injury>"}</span>
                                <span>{" and could no longer participate in outfield training or physical activities. After his medical status had been re-evaluated, LCP TEO was re-deployed to the "}</span>
                                <span style={{ color: "red" }}>{"<Insert New Coy (e.g. Battalion HQ) Or New Platoon (e.g. 'A' Company HQ)>"}</span>
                                <span>{" as a "}</span>
                                <span style={{ color: "red" }}>{"<Insert Clerk Appointment (e.g. Finance Clerk)>"}</span>
                                <span>.</span>
                            </div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">4. Inserting Pre-Unit Achievements (Optional)</div>
                            <div className="example-module-explanation">By default, the following Pre-Unit Achievements can be selected by users and inserted into Introduction templates:</div>
                            <ol>
                                <li>Sword of Honour</li>
                                <li>Sword of Merit</li>
                                <li>Golden Bayonet</li>
                                <li>Silver Bayonet</li>
                                <li>BMT Best Recruit</li>
                            </ol>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>For example, these are the default settings for &apos;Sword of Honour&apos; and &apos;Sword of Merit&apos;:</div>
                            <PreUnitAchievementForm
                                achievement_title={'Sword of Honour'}
                                achievement_wording={'To this end, {Rank} {Surname} performed the best among his peers and graduated with a Sword of Honour (Top Performer).'}
                                button_state={"save"}
                                permanently_disable_edit
                                display="block"
                            />
                            <PreUnitAchievementForm
                                achievement_title={'Sword of Merit'}
                                achievement_wording={'To this end, {rank} {surname} performed well and graduated with a Sword of Merit (Top 10%).'}
                                button_state={"save"}
                                permanently_disable_edit
                                display="block"
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction template that only applies to all Officers and includes these 2 Pre-Unit Achievements.</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Pre-Unit Achievements in curly brackets {'{ }'} e.g. {'{Sword of Honour}'} (case-insensitive).</div>
                            <IntroductionForm
                                transcript_template={'{Rank} {Full Name} served as a {Primary Appointment} in {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE).'}
                                template="{Rank} {Full Name} enlisted in the Singapore Armed Forces on {Enlistment Date}. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. {Sword of Honour} {Sword of Merit} Upon commissioning, {Rank} {Surname} was posted to {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of {Primary Appointment}."
                                related_vocation_ranks={{ 'Signals': ['Officer'], 'Combat Engineers': ['Officer'] }}
                                available_vocation_ranks={{ 'Signals': ['Officer', 'Specialist', 'Enlistee'], 'Combat Engineers': ['Officer', 'Specialist', 'Enlistee'], 'Admin': ['Enlistee'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Important Note:</div>
                            <div className="example-module-explanation">If a Pre-Unit Achievement is included in the template but is not selected by the user, it will not be part of the result. (see examples below)</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>1. No Pre-Unit Achievements Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. Upon commissioning, LTA LOKE was posted to &apos;A&apos; Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>2. &apos;Sword of Honour&apos; Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. To this end, LTA LOKE performed the best among his peers and graduated with a Sword of Honour (Top Performer). Upon commissioning, LTA LOKE was posted to &apos;A&apos; Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>3. &apos;Sword of Merit&apos; Selected:</div>
                            <div className="example-module-explanation">LTA ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. To this end, LTA LOKE performed well and graduated with a Sword of Merit (Top 10%). Upon commissioning, LTA LOKE was posted to &apos;A&apos; Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Platoon Commander.</div>
                        </div>
                    </div>
                </details>
                <details>
                    <summary className="section-summary">Introduction Templates</summary>
                    <div className="section-group">
                        {Object.entries(available_vocation_ranks).length == 0 &&
                            <div className="missing-vocation-ranks-warning">
                                <div className="missing-vocation-ranks-warning-text">
                                    <div style={{ fontWeight: 'bold', color: 'red', fontSize: "25px" }}>You have not added any relevant vocations & ranks yet!</div>
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>You should add some before adding any {section_name} templates (see the section at the top of the page).</div>
                                </div>
                            </div>
                        }
                        {(Object.entries(vocation_ranks_template_overview).length !== 0 && load_status_introduction == 'loaded') &&
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
                                                            <ul>
                                                                {vocation_ranks_template_overview[vocation][rank].map((obj, i_inner2) => {
                                                                    return (
                                                                        <div key={i_inner2} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                                                            <li style={{ color: "green" }}>{obj.title}</li>
                                                                            <div>
                                                                                {obj.achievements.length > 0 ?
                                                                                    <>
                                                                                        <li>Includes:</li>
                                                                                        <ol>
                                                                                            {obj.achievements.map((achievement, i_inner3) => <li key={i_inner3} >{achievement}</li>)}
                                                                                        </ol>
                                                                                    </>
                                                                                    :
                                                                                    null
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
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
                        {load_status_introduction == 'loaded' && (
                            <div className="top-bar">
                                <div className="search-templates">
                                    <Select
                                        className="search-by-vocation-rank"
                                        onChange={onSelectIntroductionByVocationRank}
                                        options={available_vocation_ranks_options}
                                        value={selected_introduction_vocation_rank}
                                        placeholder={"Search by Vocation-Rank"}
                                    />
                                    <button onClick={onViewAllIntroduction} className={"view-all-button"}>View All</button>
                                </div>
                                <button onClick={onAddIntroductionForm} className="add-form-button-right">Add Introduction</button>
                            </div>
                        )}
                        {load_status_introduction == 'loading' && (
                            <p className="loading-text-form-data">Loading...</p>
                        )}
                        {introductions_list.map((introduction, intro_index) => {
                            return (
                                <IntroductionForm
                                    key={introduction.id}
                                    id={introduction.id}
                                    template={introduction.template}
                                    previously_saved_template={introduction.previously_saved_template}
                                    transcript_template={introduction.transcript_template}
                                    previously_saved_transcript_template={introduction.previously_saved_transcript_template}
                                    related_vocation_ranks={introduction.related_vocation_ranks}
                                    previously_saved_related_vocation_ranks={introduction.previously_saved_related_vocation_ranks}
                                    available_vocation_ranks={available_vocation_ranks}
                                    vocation_ranks_with_templates={vocation_ranks_with_templates}
                                    button_state={introduction.button_state}
                                    display={introduction.display}
                                    introductions_list={introductions_list}
                                    set_introductions_list={set_introductions_list}
                                    intro_index={intro_index}
                                    unit={unit}
                                    set_dialog_settings={set_dialog_settings}
                                    savedPersonalParticularsFields={savedPersonalParticularsFields}
                                />
                            )
                        })}
                    </div>
                </details>
                <details>
                    <summary className="section-summary">Pre-Unit Achievements (Optional)</summary>
                    <div className="section-group">
                        {load_status_pre_unit_achievement == 'loaded' && (
                        <div className="top-bar">
                            <div className="search-templates">
                                <Select
                                    className="search-by-title"
                                    onChange={onSelectPreUnitAppointmentByTitle}
                                    options={available_pre_unit_achievement_options}
                                    value={selected_pre_unit_achievement_title}
                                    placeholder={"Search by Pre-Unit Achievement"}
                                />
                                <button onClick={onViewAllPreUnitAchievement} className={"view-all-button"}>View All</button>
                            </div>
                            <button onClick={onAddPreUnitAchievementForm} className="add-form-button-right">Add Pre-Unit Achievement</button>                            
                        </div>
                        )}
                        {load_status_pre_unit_achievement == 'loading' && (
                            <p className="loading-text-form-data">Loading...</p>
                        )}
                        {pre_unit_achievements_list.map((pre_unit_achievement, form_index) => {
                            return (
                                <PreUnitAchievementForm
                                    key={pre_unit_achievement.id}
                                    id={pre_unit_achievement.id}
                                    achievement_title={pre_unit_achievement.achievement_title}
                                    previously_saved_achievement_title={pre_unit_achievement.previously_saved_achievement_title}
                                    achievement_wording={pre_unit_achievement.achievement_wording}
                                    previously_saved_achievement_wording={pre_unit_achievement.previously_saved_achievement_wording}
                                    pre_unit_achievements_list={pre_unit_achievements_list}
                                    set_pre_unit_achievements_list={set_pre_unit_achievements_list}
                                    button_state={pre_unit_achievement.button_state}
                                    display={pre_unit_achievement.display}
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

