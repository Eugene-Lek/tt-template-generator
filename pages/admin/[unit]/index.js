import Head from 'next/head'
import { Footer } from "src/components/footer/footer"
import {Dialog} from "src/components/home/dialog"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import prisma from 'lib/prisma'
import { VocationRankForm } from "src/components/forms/vocationrankform"
import {IntroductionsPage} from "src/components/sections/introductionspage"
import {PrimaryAppointmentsPage} from "src/components/sections/primaryappointmentspage"
import {SecondaryAppointmentsPage} from "src/components/sections/secondaryappointmentspage"
import { SoldierFundamentalsPage } from "@/src/components/sections/soldierfundamentalspage"
import { OtherContributionsPage } from "@/src/components/sections/othercontributionspage"
import { OtherIndividualAchievementsPage } from "@/src/components/sections/otherindividualachievementspage"
import { ConclusionsPage } from "@/src/components/sections/conclusionspage"
import { CompaniesForm } from "@/src/components/forms/companyform"
import { AdminHeader } from '@/src/components/header/adminheader'

const init_sections = [
    {title: "Introduction", className: "section-button-selected", selected: true},
    {title: "Primary Appointments", className: "section-button-middle-unselected", selected: false},
    {title: "Secondary Appointments", className: "section-button-middle-unselected", selected: false},
    {title: "Soldier Fundamentals", className: "section-button-middle-unselected", selected: false},
    {title: "Other Contributions", className: "section-button-middle-unselected", selected: false},
    {title: "Other Individual Achievements", className: "section-button-middle-unselected", selected: false},
    {title: "Conclusion", className: "section-button-right-unselected", selected: false}
]

export default function UnitAdminHome({ unit , id, init_companies, init_vocations_list}) {
    const title = `${unit}'s T&T Template Generator Admin Page`
    const [forms_list, set_forms_list] = useState(init_vocations_list)
    const available_vocation_ranks_raw = forms_list.map((form)=> {
        const ranks_list = [form.previously_saved_ranks.have_officer ? 'Officer' : '',
        form.previously_saved_ranks.have_specialist ? 'Specialist' : '',
        form.previously_saved_ranks.have_enlistee ? 'Enlistee' : ''].filter(rank => rank) // Remove empty strings
        return [form.previously_saved_vocation, ranks_list]}).filter(pair=>pair[0]) // Remove pairs with empty vocations
    const available_vocation_ranks = Object.fromEntries(available_vocation_ranks_raw)
    console.log(available_vocation_ranks)
    const [sections, set_sections] = useState(init_sections)

    const [dialog_settings, set_dialog_settings] = useState({
        "message": '',
        "buttons": [],
        "line_props": [],
        "displayed": false,
        "onClickDialog": function(){return},
        "onClickDialogProps": {}           
    })

    const onAddVocationForm = (event) => {
        event.preventDefault()
        set_forms_list([...forms_list, {
            id: uuidv4(),
            raw_vocation: "",
            previously_saved_vocation: "",
            ranks: {
                have_officer: false,
                have_specialist: false,
                have_enlistee: false
            },
            previously_saved_ranks: {
                have_officer: false,
                have_specialist: false,
                have_enlistee: false                
            },
            button_state: "save"
        }])
    }


    const onSelectSection = (event, index) => {
        event.preventDefault()
        const temp_sections = [...sections]
        const updated_sections = temp_sections.map((section, i)=>{
            if (i==index){
                section['selected'] = true
                section['className'] = "section-button-selected"
                return section
            } else {
                section['selected'] = false
                if (i==0){
                    section['className'] = "section-button-left-unselected"
                } else if (i==temp_sections.length-1){
                    section['className'] = "section-button-right-unselected"
                } else {
                    section['className'] = "section-button-middle-unselected"
                }
                return section
            }
        })
        set_sections(updated_sections)

    }
    return (
        <>
            <head>
                <title>T&T Generator</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </head>            
            <AdminHeader title={title} unit={unit} id={id} set_dialog_settings={set_dialog_settings}/>
            <main className="home-body">
                <section className="big-section">
                    <h2 className="big-section-title">1. Add Companies</h2>
                    <div className="big-section-description-group">
                        <p className="big-section-description"> Add the coys that belong to your unit! </p>                
                        <p className="big-section-description">These coy names will be inserted into the T&T templates, so you should write them in the way you want them to be displayed. (e.g. Headquarters instead of HQ) </p>
                    </div>
                    <CompaniesForm
                    init_companies={init_companies}
                    unit={unit}
                    set_dialog_settings={set_dialog_settings}
                    />                  
                </section>
                <section className="big-section">
                    <h2 className="big-section-title">2. Add Relevant Vocations & Ranks</h2>
                    <div className="big-section-description-group">
                        <p className="big-section-description"> Add the vocation-rank combinations that apply to your unit!</p>
                    </div>                    
                    <div className="vocation-group">
                        {forms_list.map((form, index) => {
                            return <VocationRankForm 
                                    key={form.id} 
                                    id={form.id} 
                                    raw_vocation={form.raw_vocation} 
                                    previously_saved_vocation={form.previously_saved_vocation}
                                    ranks={form.ranks}
                                    previously_saved_ranks={form.previously_saved_ranks}
                                    button_state={form.button_state} 
                                    forms_list={forms_list} 
                                    set_forms_list={set_forms_list} 
                                    index={index} 
                                    unit={unit} 
                                    dialog_settings={dialog_settings}
                                    set_dialog_settings={set_dialog_settings}                               
                                    />;
                        })}
                        <button onClick={onAddVocationForm} className="add-vocation-form-button">Add Vocation</button>
                    </div>
                </section>
                <section className="big-section">
                    <h2 className="big-section-title">3. Write Templates for Each Section</h2>
                    <div className="section-button-group">
                        {sections.map((section, index) => {
                            return (
                                <button 
                                key={index} 
                                onClick={(event) => {onSelectSection(event, index)}} 
                                className={section.className}
                                style={{
                                    textAlign: "center",
                                    paddingLeft: "25px",
                                    paddingRight: "25px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",                        
                                    cursor: "pointer"                                
                                }}
                                >
                                {section.title}
                                </button>                            
                            )
                        })}
                    </div>
                    {sections[0]['selected'] && (
                        <IntroductionsPage 
                            unit={unit} 
                            section_name={sections[0]['title']} 
                            available_vocation_ranks={available_vocation_ranks}
                            set_dialog_settings={set_dialog_settings}   
                        />
                        )}
                    {sections[1]['selected'] && (
                        <PrimaryAppointmentsPage 
                            unit={unit} 
                            section_name={sections[1]['title']} 
                            available_vocation_ranks={available_vocation_ranks}
                            set_dialog_settings={set_dialog_settings}   
                        />
                        )}    
                    {sections[2]['selected'] && (
                        <SecondaryAppointmentsPage 
                            unit={unit} 
                            section_name={sections[2]['title']} 
                            available_vocation_ranks={available_vocation_ranks}
                            set_dialog_settings={set_dialog_settings}   
                        />
                        )}  
                    {sections[3]['selected'] && (
                        <SoldierFundamentalsPage 
                            unit={unit} 
                            section_name={sections[3]['title']} 
                            available_vocation_ranks={available_vocation_ranks}
                            set_dialog_settings={set_dialog_settings}   
                        />
                        )}         
                    {sections[4]['selected'] && (
                        <OtherContributionsPage 
                            unit={unit} 
                            section_name={sections[4]['title']} 
                            available_vocation_ranks={available_vocation_ranks}
                            set_dialog_settings={set_dialog_settings}   
                        />
                        )}  
                    {sections[5]['selected'] && (
                        <OtherIndividualAchievementsPage 
                            unit={unit} 
                            section_name={sections[5]['title']} 
                            available_vocation_ranks={available_vocation_ranks}
                            set_dialog_settings={set_dialog_settings}   
                        />
                        )}      
                    {sections[6]['selected'] && (
                        <ConclusionsPage 
                            unit={unit} 
                            section_name={sections[6]['title']} 
                            available_vocation_ranks={available_vocation_ranks}
                            set_dialog_settings={set_dialog_settings}   
                        />
                        )}             
                </section>                                                                                                 
                {dialog_settings.displayed && (
                    <Dialog
                        message={dialog_settings.message}
                        buttons={dialog_settings.buttons}
                        line_props={dialog_settings.line_props}
                        displayed={dialog_settings.displayed} 
                        onClickDialog={dialog_settings.onClickDialog}  
                        onClickDialogProps={dialog_settings.onClickDialogProps}              
                    />
                )}
            </main>
            <Footer />
        </>
    )
}

export async function getServerSideProps({params}) {
    const unit = params.unit.toUpperCase()
    const unit_data_dict = await prisma.Unit.findUnique({
        where: {
            name: unit
        },
        include: {
            Vocations: true
        }
    })
    const unit_companies = unit_data_dict.Companies
    if (unit_companies.length < 1){
        var init_companies = {
            companies: [''],
            previously_saved_companies: [''],
            button_state: "save"
        }
    } else {
        var init_companies = {
            companies: unit_companies,
            previously_saved_companies: unit_companies,
            button_state: "edit"
        }        
    }
    const unit_vocations = unit_data_dict.Vocations
    if (unit_vocations.length < 1) {
        var init_vocations_list = [{
            id: uuidv4(),
            raw_vocation: "",
            previously_saved_vocation:  "",            
            ranks: {
                have_officer: false,
                have_specialist: false,
                have_enlistee: false
            },
            previously_saved_ranks: {
                have_officer: false,
                have_specialist: false,
                have_enlistee: false            
            },
            button_state: "save"
        }]
    } else {
        var init_vocations_list = unit_vocations.map((vocation) => {
            return {
                id: vocation.id,
                raw_vocation: vocation.name,
                previously_saved_vocation: vocation.name, 
                ranks: {
                    have_officer: vocation.ranks.includes('Officer'),
                    have_specialist: vocation.ranks.includes('Specialist'),
                    have_enlistee: vocation.ranks.includes('Enlistee')                    
                },
                previously_saved_ranks: {
                    have_officer: vocation.ranks.includes('Officer'),
                    have_specialist: vocation.ranks.includes('Specialist'),
                    have_enlistee: vocation.ranks.includes('Enlistee')   
                },
                button_state: "edit"
            }
        })
    }
    return {
        props: {
            unit,
            id: unit_data_dict.id, 
            init_companies,
            init_vocations_list
        }
    }
}