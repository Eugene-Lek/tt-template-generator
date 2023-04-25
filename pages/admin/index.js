import Head from 'next/head'
import Select from 'react-select'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Header } from "src/components/header/header"
import { Dialog } from "src/components/home/dialog"
import prisma from '@/lib/prisma'
import ServicemanDetailsForm from '@/src/components/forms/servicemandetailsform'


export default function AdminLogin({ units }) {

    const units_options = units.map(unit => ({ label: unit, value: unit }))

    const [selected_unit, set_selected_unit] = useState('')
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
    const onAttemptLogin = (event) => {
        event.preventDefault()
        const authenticated = true
        // Make API call to authenticate user
        if (authenticated) {
            router.push(`admin/${selected_unit}`)
        }
    }

    return (
        <>
            <Head>
                <title>T&T Generator</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main>
                <Header title={"Admin Login"} subtitle={"Sign in to manage your unit's T&T template generator!"} />
                <section className="big-section">
                    <div className='login-group'>
                        <Select
                            instanceId="43b2b7e7-914f-4760-92b9-b1472920ef8e"
                            className="select-unit"
                            onChange={option => set_selected_unit(option.value)}
                            options={units_options}
                            placeholder={"Your Unit"} />
                        <input className='login-input' onChange={event => set_input_password(event.target.value)} type={"password"} placeholder='Password'></input>
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
    const unit_names_list = await prisma.Unit.findMany({
        select: {
            name: true
        }
    })
    const units = unit_names_list.map(obj => obj.name)
    units.sort()
    return {
        props: {
            units
        }
    }
}