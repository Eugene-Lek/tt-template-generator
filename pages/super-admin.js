
import { UnitForm } from "@/src/components/forms/unitform";
import { Header } from "@/src/components/header/header";
import { Dialog } from "@/src/components/home/dialog";
import Head from 'next/head'
import Select from "react-select";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid"
import { cloneDeep } from "lodash";
import prisma from "@/lib/prisma";
import { CreateUnitDialog } from "@/src/components/home/createunitdialog";


const do_not_initialise_phrase = 'Do not Initialise'

export default function SuperAdmin({ units_init_data }) {

    const [units_data, set_units_data] = useState(units_init_data)
    const [selected_unit, set_selected_unit] = useState('')
    const [selected_unit_to_delete, set_selected_unit_to_delete] = useState('')
    const [selected_copy_unit, set_selected_copy_unit] = useState('')
    const [unit_to_delete_data, set_unit_to_delete_data] = useState({})

    const [dialog_settings, set_dialog_settings] = useState({
        "message": '',
        "buttons": [],
        "line_props": [],
        "displayed": false,
        "onClickDialog": function () { return },
        "onClickDialogProps": {}
    })
    const [create_unit_dialog_settings, set_create_unit_dialog_settings] = useState({
        "unit": '',
        "displayed": false,
        "onClickDialog": function () { return },
        "onClickDialogProps": {}
    })

    // Make an API call to obtain the most updated unit information.
    useEffect(() => {
        const fetchSectionData = async () => {
            const units_response = await fetch(`/api/units`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (!units_response.ok) {
                const response_data = await units_response.json()
                displayErrorMessage(response_data.message)                          
                return
            }            
            const units_response_data = await units_response.json()
            set_units_data(units_response_data.units_init_data)
        }
        fetchSectionData()

    }, [units_data.filter(obj => obj.previously_saved_unit).length])


    /*DEFINING COMMONLY USED DIALOG FUNCTIONS*/
    const closeDialogueBox = () => {
        set_dialog_settings({
            "message": '',
            "buttons": [],
            "line_props": [],
            "displayed": false,
            "onClickDialog": function () { return },
            "onClickDialogProps": {}
        })
    }

    const displayErrorMessage = async (error_message) => {

        // This is necessary as the number of lines error messages consist of varies
        const error_num_lines = error_message.split('\n').length
        const error_lines_props = Array(error_num_lines).fill({
            color: "#000000", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "auto"
        })
        set_dialog_settings({
            "message":
                `*Error*
                ${error_message}`,
            "buttons": [
                { text: "Close", action: "exit", background: "#01a4d9", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "red", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                ...error_lines_props],
            "displayed": true,
            "onClickDialog": closeDialogueBox,
            "onClickDialogProps": { set_dialog_settings }
        })
    }

    //
    const onAddUnitForm = (event) => {
        event.preventDefault()
        set_units_data([{
            id: uuidv4(),
            unit: "",
            previously_saved_unit: "",
            overview_data: {
                Companies: [],
                Vocations: [],
                Introductions: [],
                PreUnitAchievements: [],
                PrimaryAppointments: [],
                PrimaryAppointmentsAchievements: [],
                SecondaryAppointments: [],
                SoldierFundamentals: [],
                OtherContributions: [],
                OtherIndividualAchievements: [],
                Conclusions: []
            },
            button_state: "save",
            display: "block"
        }, ...units_data])
    }

    const onViewAll = (event) => {
        event.preventDefault()
        let temp_units_data = cloneDeep(units_data)
        temp_units_data.forEach(unit_data => {
            unit_data['display'] = 'block'
        })
        set_units_data(temp_units_data)
        set_selected_unit(null)
    }

    const onSelectByTitle = (option) => {
        // Necessary because selected_unit_data_unit is used to set the value of the select box
        set_selected_unit(option)

        const selected_unit = option.value
        let temp_units_data = cloneDeep(units_data)
        temp_units_data.forEach(unit_data => {
            if (unit_data['unit'] == selected_unit ||
                unit_data['previously_saved_unit'] == selected_unit) {
                unit_data['display'] = 'block'
            }
            else {
                unit_data['display'] = 'none'
            }
        })
        set_units_data(temp_units_data)
    }

    const onSelectUnitToDelete = (option) => {
        // Necessary because selected_unit_data_unit is used to set the value of the select box
        set_selected_unit_to_delete(option)

        const selected_unit = option.value
        let temp_units_data = cloneDeep(units_data)
        const unit_data = temp_units_data.filter(obj => obj.unit == selected_unit || obj.previously_saved_unit == selected_unit)[0]
        set_unit_to_delete_data(unit_data)
    }
    // Only display previously saved options to be safe
    let available_unit_names = units_data.map(unit_data => unit_data.previously_saved_unit).filter(element => element)
    available_unit_names.sort()
    const available_unit_options = available_unit_names.map((unit) => ({ label: unit, value: unit }))


    const onClickDelete = async (event, previously_saved_unit) => {
        event.preventDefault()

        // Generate a Delete Confirmation Dialog by changing the state of the existing dialog object
        set_dialog_settings({
            "message":
                `*Are you sure you want to delete ${previously_saved_unit}'s T&T Template Generator account?*

                *This action is irreversible and all of the unit's templates will be permenantly deleted.*`,
            "buttons": [
                { text: "Yes", action: "delete", background: "#E60023", color: "#FFFFFF" },
                { text: "No", action: "cancel", background: "#00ac13", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#000000", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                { color: "red", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0" }],
            "displayed": true,
            "onClickDialog": handleDeleteConfirmation,
            "onClickDialogProps": {
                previously_saved_unit,
                units_data,
                set_units_data,
            }
        })
    }

    /*FUNCTIONS WHICH HANDLE A USER'S RESPONSE TO THE DISPLAYED DIALOGUE BOX*/

    const handleDeleteConfirmation = ({
        previously_saved_unit,
        units_data,
        set_units_data,
        action
    }) => {
        // Close the dialog no matter what
        set_dialog_settings({
            "message": '',
            "buttons": [],
            "line_props": [],
            "displayed": false,
            "onClickDialog": function () { return },
            "onClickDialogProps": {}
        })
        // Break out of the function if the delete operation is cancelled
        if (action == "cancel" || action == "exit") {
            return
        }
        // Otherwise execute the delete operation
        deleteUnit({
            previously_saved_unit,
            units_data,
            set_units_data,
        })
    }

    const deleteUnit = async ({
        previously_saved_unit,
        units_data,
        set_units_data,
    }) => {
        try {
            const response = await fetch("/api/units", {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unit: previously_saved_unit,
                })
            })
            if (response.status == 200) {
                let temp_units_data = cloneDeep(units_data)
                temp_units_data = temp_units_data.filter(obj => obj.previously_saved_unit !== previously_saved_unit)
                set_units_data(temp_units_data)
                set_unit_to_delete_data({})
                console.log(units_data)
            } else if (!response.ok) {
                const response_data = await response.json()
                displayErrorMessage(response_data.message)
            }

        } catch (error) {
            displayErrorMessage(error.message)
        }

    }

    return (
        <>
            <Head>
                <title>T&T Template Generator</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="robots" content="noindex,nofollow"/>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header title={"Super-Admin Page"} subtitle={"Manage Unit Admin Accounts"} />
            <main>
                <section className="big-section">
                    <h2 className="big-section-title">Create & Edit Unit Admin Accounts</h2>
                    <div className="big-section-description-group">
                        <p className="big-section-description"></p>
                    </div>
                    <div style={{ maxWidth: "970px", width: "100%", marginLeft: "auto", marginRight: "auto" }}>
                        <div className="top-bar">
                            <div className="search-templates">
                                <Select
                                    className="search-by-title"
                                    onChange={onSelectByTitle}
                                    options={available_unit_options}
                                    value={selected_unit}
                                    placeholder={"Search by Unit"}
                                />
                                <button onClick={onViewAll} className={"view-all-button"}>View All</button>
                            </div>
                            <button onClick={onAddUnitForm} className="add-form-button-right">Create Unit Admin Account</button>
                        </div>
                    </div>
                    <div className="unit-group">
                        {units_data.map((unit_data, index) => {
                            return <UnitForm
                                key={unit_data.id}
                                id={unit_data.id}
                                unit={unit_data.unit}
                                previously_saved_unit={unit_data.previously_saved_unit}
                                overview_data={unit_data.overview_data}
                                button_state={unit_data.button_state}
                                display={unit_data.display}
                                units_data={units_data}
                                set_units_data={set_units_data}
                                index={index}
                                set_dialog_settings={set_dialog_settings}
                                set_create_unit_dialog_settings={set_create_unit_dialog_settings}
                            />;
                        })}
                    </div>
                </section>
                <section className="big-section">
                    <h2 className="big-section-title">Delete Unit Admin Accounts</h2>
                    <div className="big-section-description-group">
                        <p className="big-section-description"> Deletions are irreversible. Only delete Unit admin accounts if you are absolutely sure!</p>
                    </div>
                    <div style={{ marginLeft: "auto", marginRight: "auto" }}>
                        <div className="select-unit-main">
                            <Select
                                className="search-by-title"
                                onChange={onSelectUnitToDelete}
                                options={available_unit_options}
                                value={selected_unit_to_delete}
                                placeholder={"Search by Unit"}
                            />
                        </div>
                    </div>
                    <div className="unit-group">
                        {Object.keys(unit_to_delete_data).length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <div className="unit-module">
                                    <div className="unit-input-button-group">
                                        <input className="unit-input" value={unit_to_delete_data.unit} disabled></input>
                                    </div>
                                    <div className="unit-overview">
                                        <div>
                                            <div className="overview-header">Personal Particular Fields</div>
                                            {unit_to_delete_data.overview_data.PersonalParticularsFields?.length > 0 ?
                                                <div className="overview-text">{unit_to_delete_data.overview_data.PersonalParticularsFields.map(fieldSet => `${fieldSet.name} (${fieldSet.type})`).join(", ")}</div>
                                                : <div className="overview-text" style={{ color: "red" }}>No Personal Particular Fields have been added yet</div>}
                                        </div>
                                        <div>
                                            <div className="overview-header">Vocations</div>
                                            {unit_to_delete_data.overview_data.Vocations?.length > 0 ?
                                                <div className="overview-text" >{unit_to_delete_data.overview_data.Vocations.map(obj => obj.name).join(", ")}</div>
                                                : <div className="overview-text" style={{ color: "red" }}>No Vocations have been added yet</div>}
                                        </div>
                                        <div>
                                            <div className="overview-header">Number of Templates</div>
                                            <div className="overview-text">Introductions: {unit_to_delete_data.overview_data.Introductions.length}</div>
                                            <div className="overview-text">Pre-Unit Achievements: {unit_to_delete_data.overview_data.PreUnitAchievements.length}</div>
                                            <div className="overview-text">Primary Appointments: {unit_to_delete_data.overview_data.PrimaryAppointments.length}</div>
                                            <div className="overview-text">Secondary Appointments: {unit_to_delete_data.overview_data.SecondaryAppointments.length}</div>
                                            <div className="overview-text">Soldier Fundamentals: {unit_to_delete_data.overview_data.SoldierFundamentals.length}</div>
                                            <div className="overview-text">Other Contributions: {unit_to_delete_data.overview_data.OtherContributions.length}</div>
                                            <div className="overview-text">Other Individual Achievements: {unit_to_delete_data.overview_data.OtherIndividualAchievements.length}</div>
                                            <div className="overview-text">Conclusions: {unit_to_delete_data.overview_data.Conclusions.length}</div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={(event) => { onClickDelete(event, unit_to_delete_data.previously_saved_unit) }} className={"delete-button-visible"}>Delete</button>
                            </div>
                        ) : <div className="overview-text" style={{ color: "red", marginBottom: "250px" }}>No unit has been selected</div>}
                    </div>
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
                {create_unit_dialog_settings.displayed && (
                    <CreateUnitDialog
                        unit={create_unit_dialog_settings.unit}
                        selected_copy_unit={selected_copy_unit}
                        set_selected_copy_unit={set_selected_copy_unit}
                        available_unit_options={[
                            { label: do_not_initialise_phrase, value: do_not_initialise_phrase },
                            ...available_unit_options
                        ].filter(obj => obj.label !== create_unit_dialog_settings.unit)}
                        onClickDialog={create_unit_dialog_settings.onClickDialog}
                        onClickDialogProps={create_unit_dialog_settings.onClickDialogProps}
                    />
                )}

            </main>
        </>
    )
}


export async function getServerSideProps() {
    const units_data = await prisma.Unit.findMany({
        include: {
            PersonalParticularsFields: {
                orderBy: {
                    order: 'asc',
                  },                            
            },            
            Vocations: true,
            Introductions: true,
            PreUnitAchievements: true,
            PrimaryAppointments: true,
            SecondaryAppointments: true,
            SoldierFundamentals: true,
            OtherContributions: true,
            OtherIndividualAchievements: true,
            Conclusions: true
        }
    })
    if (units_data.length == 0) {
        var units_init_data = [
            {
                id: uuidv4(),
                unit: "",
                overview_data: {
                    PersonalParticularsFields: [],
                    Vocations: [],
                    Introductions: [],
                    PreUnitAchievements: [],
                    PrimaryAppointments: [],
                    PrimaryAppointmentsAchievements: [],
                    SecondaryAppointments: [],
                    SoldierFundamentals: [],
                    OtherContributions: [],
                    OtherIndividualAchievements: [],
                    Conclusions: []
                },
                previously_saved_unit: "",
                button_state: "save",
                display: "block"
            }
        ]
    } else {
        var units_init_data = units_data.map(unit => {
            return {
                id: unit.id,
                unit: unit.name,
                previously_saved_unit: unit.name,
                overview_data: unit,
                button_state: "edit",
                display: "block"
            }
        }
        )
    }
    return {
        props: {
            units_init_data: units_init_data
        }
    }
}