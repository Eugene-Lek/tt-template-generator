import { IntroductionForm } from "src/components/forms/introductionform"
import { PreUnitAchievementForm } from "src/components/forms/preunitachievementform"
import Select from "react-select"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import cloneDeep from 'lodash/cloneDeep';

const valid_ranks = ["Officer", "Specialist", "Enlistee"]

export function IntroductionsPage({ unit, section_name, available_vocation_ranks, set_dialog_settings }) {

    const [load_status, set_load_status] = useState('loading')
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
            console.log(introductions_response_data.init_introductions_list)
            const pre_unit_achievements_response = await fetch(`/api/pre-unit-achievements?unit=${unit}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const pre_unit_achievements_response_data = await pre_unit_achievements_response.json()
            console.log(pre_unit_achievements_response_data)
            set_introductions_list(introductions_response_data.init_introductions_list)
            set_pre_unit_achievements_list(pre_unit_achievements_response_data.init_list)
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
            if (introduction["related_vocation_ranks"][selected_rank]?.includes(selected_vocation) ||
                introduction["previously_saved_related_vocation_ranks"][selected_rank]?.includes(selected_vocation)) {
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
    var previously_saved_vocation_ranks_without_templates = getVocationRanksWithMissingTemplates(available_vocation_ranks, introductions_list, "previously_saved_related_vocation_ranks")
    var vocation_ranks_with_templates = getVocationRanksWithTemplates(available_vocation_ranks, introductions_list)
    const available_vocation_ranks_strings = [].concat(...Object.keys(available_vocation_ranks).map((rank) => {
        return available_vocation_ranks[rank].map(vocation => `${vocation} ${rank}`)
    }))
    available_vocation_ranks_strings.sort()
    const available_vocation_ranks_options = available_vocation_ranks_strings.map(vocation_rank => ({ label: vocation_rank, value: vocation_rank }))
    let available_pre_unit_achievement_titles = [].concat(...pre_unit_achievements_list.map(achievement => [achievement.achievement_title, achievement.previously_saved_achievement_title]))
    available_pre_unit_achievement_titles = [... new Set(available_pre_unit_achievement_titles)]
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
                            <div className="example-module-title">1. Assigning an Introduction Template to a Vocation-Rank Combination (e.g. Signal Enlistee)</div>
                            <div className="example-module-explanation">Each Vocation-Rank combination (e.g. Signal Specialist, Infantry Officer etc) must have an Introduction Template.</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction template that only applies to Signal Enlistees:</div>
                            <IntroductionForm
                                transcript_template="... 30th Battalion, Singapore Combat Engineers ... Signal Operator"
                                template="... Basic Military Training. ... Signals Institute. ... 30th Battalion, Singapore Combat Engineers, ... Signal Operator "
                                related_vocation_ranks={{ 'Enlistee': ['Signals'] }}
                                available_vocation_ranks={{ 'Officer': ['Signals', 'Combat Engineers'], 'Specialist': ['Signals', 'Combat Engineers'], 'Enlistee': ['Signals', 'Combat Engineers', 'Admin'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
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
                                related_vocation_ranks={{ 'Specialist': ['Signals', 'Combat Engineers'] }}
                                available_vocation_ranks={{ 'Officer': ['Signals', 'Combat Engineers'], 'Specialist': ['Signals', 'Combat Engineers'], 'Enlistee': ['Signals', 'Combat Engineers', 'Admin'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Result:</div>
                            <div className="example-module-explanation">3SG ETHAN LOKE enlisted in the Singapore Armed Forces on 21 June 2021. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Specialist Cadet Course. Subsequently, 3SG LOKE was posted to 'A' Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of Section Commander.</div>
                        </div>
                        <div className="example-module">
                            <div className="example-module-title">3. Indicating Where Users Should Manually Insert Personal Elements</div>
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction Template for ASAs who OOC-ed from their original vocational course due to an injury.</div>
                            <div className="example-module-explanation">To indicate where users should manually insert the physical injury that the serviceman had suffered from, we need to include {"<Insert Physical Injury>"}.</div>
                            <div className="example-module-explanation">Anything wraped in {"<"} and {">"} will be coloured red by the program to catch the user&apos;s attention (Note: It will only be coloured red in the result). </div>
                            <IntroductionForm
                                transcript_template={'{Rank} {Full Name} served as a {Primary Appointment} in {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE).'}
                                template="{Rank} {Full Name} enlisted in the Singapore Armed Forces on {Enlistment Date}. Upon completion of his Basic Military Training, he was posted to <Insert Original Company> Company, 30th Battalion, Singapore Combat Engineers (30SCE) to serve as a Field Engineer Pioneer. Unfortunately, {Rank} {Surname} ended up suffering from <Insert Physical Injury> and could no longer participate in outfield training or physical activities. After his medical status had been re-evaluated, {Rank} {Surname} was re-deployed to the <Insert New Coy (e.g. Battalion HQ) Or New Platoon (e.g. 'A' Company HQ)> as a <Insert Clerk Appointment (e.g. Finance Clerk)>."
                                related_vocation_ranks={{ 'Enlistee': ['Admin'] }}
                                available_vocation_ranks={{ 'Officer': ['Signals', 'Combat Engineers'], 'Specialist': ['Signals', 'Combat Engineers'], 'Enlistee': ['Signals', 'Combat Engineers', 'Admin'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
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
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>For example, these are the default settings for 'Sword of Honour' and 'Sword of Merit':</div>
                            <PreUnitAchievementForm
                                achievement_title={'Sword of Honour'}
                                achievement_wording={'To this end, {Rank} {Surname} performed the best among his peers and graduated with a Sword of Honour (Top Performer).'}
                                button_state={"save"}
                                permanently_disable_edit
                            />
                            <PreUnitAchievementForm
                                achievement_title={'Sword of Merit'}
                                achievement_wording={'To this end, {rank} {surname} performed well and graduated with a Sword of Merit (Top 10%).'}
                                button_state={"save"}
                                permanently_disable_edit
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold' }}>Let&apos;s say we want to write an Introduction template that only applies to all Officers and includes these 2 Pre-Unit Achievements.</div>
                            <div className="example-module-explanation">To do so, we need to wrap the Pre-Unit Achievements in curly brackets {'{ }'} e.g. {'{Sword of Honour}'} (case-insensitive).</div>
                            <IntroductionForm
                                transcript_template={'{Rank} {Full Name} served as a {Primary Appointment} in {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE).'}
                                template="{Rank} {Full Name} enlisted in the Singapore Armed Forces on {Enlistment Date}. Having displayed strong potential for military leadership during his Basic Military Training, he was selected to attend the Officer Cadet School where he underwent training to become a commissioned Army Officer. {Sword of Honour} {Sword of Merit} Upon commissioning, {Rank} {Surname} was posted to {Coy} Company, 30th Battalion, Singapore Combat Engineers (30SCE) to take on the appointment of {Primary Appointment}."
                                related_vocation_ranks={{ 'Officer': ['Signals', 'Combat Engineers'] }}
                                available_vocation_ranks={{ 'Officer': ['Signals', 'Combat Engineers'], 'Specialist': ['Signals', 'Combat Engineers'], 'Enlistee': ['Signals', 'Combat Engineers'] }}
                                button_state={"save"}
                                permanently_disable_edit={true}
                            />
                            <div className="example-module-explanation" style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '20px' }}>Important Note:</div>
                            <div className="example-module-explanation">If a Pre-Unit Achievement is included in the template but is not selected by the user, it will not be part of the result. (see examples below)</div>
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
                        {(Object.entries(previously_saved_vocation_ranks_without_templates).length !== 0 && load_status == 'loaded') &&
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
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>You can either create new Introduction templates for them or assign existing Introduction templates to them!</div>
                                    <div style={{ fontWeight: 'bold', color: 'black', fontSize: "15px" }}>(Remember to click Save!)</div>
                                </div>
                            </div>
                        }
                        {load_status == 'loaded' && (
                            <div className="search-templates">
                                <Select
                                    className="search-by-vocation-rank"
                                    onChange={onSelectIntroductionByVocationRank}
                                    options={available_vocation_ranks_options}
                                    value={selected_introduction_vocation_rank}
                                    placeholder={"Search by Vocation-Rank"}
                                />
                                <button onClick={onViewAllIntroduction} className={"view-all-button"}>View All</button>
                                <button onClick={onAddIntroductionForm} className="add-form-button-right">Add Introduction</button>
                            </div>
                        )}
                        {load_status == 'loading' && (
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
                                />
                            )
                        })}
                    </div>
                </details>
                <details>
                    <summary className="section-summary">Pre-Unit Achievements (Optional)</summary>
                    <div className="section-group">
                        {load_status == 'loaded' && (
                            <div className="search-templates">
                                <Select
                                    className="search-by-title"
                                    onChange={onSelectPreUnitAppointmentByTitle}
                                    options={available_pre_unit_achievement_options}
                                    value={selected_pre_unit_achievement_title}
                                    placeholder={"Search by Pre-Unit Achievement"}
                                />
                                <button onClick={onViewAllPreUnitAchievement} className={"view-all-button"}>View All</button>
                                <button onClick={onAddPreUnitAchievementForm} className="add-form-button-right">Add Pre-Unit Achievement</button>
                            </div>
                        )}
                        {load_status == 'loading' && (
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

