import Head from 'next/head'
import { useState, useEffect } from 'react'
import { Header } from "src/components/header/header"
import { Dialog } from "src/components/home/dialog"
import ServicemanDetailsForm from '@/src/components/forms/servicemandetailsform'


export default function Home({ selected_unit, unit_data }) {

    const [dialog_settings, set_dialog_settings] = useState({
        "message": '',
        "buttons": [],
        "line_props": [],
        "displayed": false,
        "onClickDialog": function () { return },
        "onClickDialogProps": {}
    })

    return (
        <>
            <Head>
                <title>T&T Template Generator</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="robots" content="noindex,nofollow" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main>
                <Header title={"T&T Template Generator"} subtitle={"Write Well-Written, Well-Organised, and Personalised T&Ts"} />
                <section className="big-section">
                    <h2 className="big-section-title">Provide Your Serviceman&apos;s Details</h2>
                    <ServicemanDetailsForm
                        selected_unit={selected_unit}
                        unit_data={unit_data}
                        set_dialog_settings={set_dialog_settings}
                    />
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


export async function getServerSideProps({ params, req }) {
    const selected_unit = params.unit.toUpperCase()

    const { cookie } = req.headers

    if (!cookie) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    const rootURL = process.env.NODE_ENV == "production" ? process.env.SERVER_URL : 'http://localhost:3000'
    const response = await fetch(`${rootURL}/api/authentication/verifyauthentication?unitName=${selected_unit}&cookieType=UserAuth`, {
        credentials: "include",
        headers: { cookie },
    })
    
    if (response.status == 401) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    if (response.status == 500) {
        const error = await response.json()
        return {
            props: {
                error: error.message
            }
        }
    }

    const unit_data_response = await fetch(`${rootURL}/api/unit-data?unit=${selected_unit}`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            cookie            
        }
    })
    const {unit_data_dict: unit_data} = await unit_data_response.json()

    return {
        props: {
            selected_unit,
            unit_data
        }
    }
}