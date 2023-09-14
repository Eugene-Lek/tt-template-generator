import Head from 'next/head'
import Select from 'react-select'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Header } from "src/components/header/header"
import { Dialog } from "src/components/home/dialog"
import prisma from '@/lib/prisma'
import ServicemanDetailsForm from '@/src/components/forms/servicemandetailsform'


export default function AdminLogin({ units }) {

    const units_options = units.map(unit => ({ label: unit.name, value: unit }))

    const [selected_unit, set_selected_unit] = useState({name: undefined, id: undefined})
    const [input_password, set_input_password] = useState('')
    const router = useRouter()

    const [dialog_settings, set_dialog_settings] = useState({
        "message": '',
        "buttons": [],
        "line_props": [],
        "displayed": false,
        "onClickDialog": function () { return },
        "onClickDialogProps": {}
    })

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

        // If the error message consists of more than 1 line, align the text to the left instead
        if (error_num_lines == 1) {
            var error_lines_props = Array(error_num_lines).fill({
                color: "#000000", font_size: "16px", text_align: "center", margin_right: "auto", margin_left: "auto"
            })
        } else {
            var error_lines_props = Array(error_num_lines).fill({
                color: "#000000", font_size: "16px", text_align: "left", margin_right: "auto", margin_left: "0"
            })
        }

        set_dialog_settings({
            "message":
                `*Error*
                ${error_message}`,
            "buttons": [
                { text: "Close", action: "exit", background: "#01a4d9", color: "#FFFFFF" }
            ],
            "line_props": [
                { color: "#E60023", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                ...error_lines_props],
            "displayed": true,
            "onClickDialog": closeDialogueBox,
            "onClickDialogProps": { set_dialog_settings }
        })
    }

    const onAttemptLogin = async() => {
        // Input validation
        if (!selected_unit.name || !selected_unit.id) {
            displayErrorMessage("You have not selected a unit")
            return
        }           
        
        if (!input_password) {
            displayErrorMessage("You have not keyed in the password")
            return            
        }
        
        const verification = await fetch(`/api/authentication/verifyadminpassword?current_password=${encodeURIComponent(input_password)}&unitID=${encodeURIComponent(selected_unit.id)}&timestamp=${new Date().getTime()}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!verification.ok) {
            const response_data = await verification.json()
            displayErrorMessage(response_data.message)  
            return              
        } else {
            router.push(`/admin/${selected_unit.name}`)
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
            <main>
                <Header title={"Admin Login"} subtitle={"Sign in to manage your unit's T&T template generator!"} />
                <section className="big-section">
                    <div className='login-group'>
                        <Select
                            instanceId="43b2b7e7-914f-4760-92b9-b1472920ef8e"
                            className="select-unit-admin"
                            onChange={option => set_selected_unit(option.value)}
                            options={units_options}
                            placeholder={"Your Unit"} />
                        <input className='login-input' onChange={(event) => {set_input_password(event.target.value)}} type={"password"} placeholder='Password'></input>
                        <button onClick={onAttemptLogin} className='login-button'>Login</button>
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
            </main>
        </>
    )
}


export async function getServerSideProps() {
    const units = await prisma.Unit.findMany({
        select: {
            id: true,
            name: true
        }
    })

    units.sort((a, b) => {
        const xString = String(a.name);
        const yString = String(b.name);
    
        if( xString < yString )
            return -1;
    
        if( xString > yString )
            return 1;
    
        return 0;
    })

    return {
        props: {
            units
        }
    }
}