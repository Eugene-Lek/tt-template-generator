import Head from 'next/head'
import { Footer } from "src/components/footer/footer"
import { Dialog } from "src/components/home/dialog"
import { useState } from "react"
import prisma from 'lib/prisma'


import ResetAdminPaswordForm from "@/src/components/forms/resetadminpasswordform";
import ResetUserPaswordForm from "@/src/components/forms/resetuserpasswordform";
import { AdminHeader } from '@/src/components/header/adminheader'


export default function ResetPasswords({ unitName, unitID, error }) {

    const [dialog_settings, set_dialog_settings] = useState({
        "message": '',
        "buttons": [],
        "line_props": [],
        "displayed": false,
        "onClickDialog": function () { return },
        "onClickDialogProps": {}
    })

    if (error) {
        return (
            <>
                <Head>
                    <title>T&T Generator</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <main>
                    <Dialog
                        message={
                            `*Error*
                            ${error}`
                        }
                        buttons={[]}
                        line_props={[
                            { color: "#E60023", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                            ...error_lines_props
                        ]}
                        onClickDialog={function () { return }}
                        onClickDialogProps={{}}
                    />
                </main>
            </>
        )        
    }

    if (!unitID) {
        const error_message = `*${unit.name}* does not exist in the database. 
                                You should go to *https://tt-template-generator.vercel.app/admin* and look for your unit in the selection box`
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
        return (
            <>
                <Head>
                    <title>T&T Generator</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <main>
                    <Dialog
                        message={
                            `*Error*
                            ${error_message}`
                            }
                        buttons={[]}
                        line_props={[
                            { color: "#E60023", font_size: "25px", text_align: "center", margin_right: "auto", margin_left: "auto" },
                            ...error_lines_props
                        ]}
                        onClickDialog={function () { return }}
                        onClickDialogProps={{}}
                    />                    
                </main>
            </>
        )
    }

    return (
        <>
            <Head>
                <title>T&T Template Generator</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="robots" content="noindex,nofollow" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <AdminHeader title={`${unitName}'s T&T Template Generator Admin Page`} unit={unitName} id={unitID} set_dialog_settings={set_dialog_settings} />
            <main>
                <div style={{ display: "flex", flexDirection: "column", gap: "48px", marginTop: "48px" }}>
                    <ResetAdminPaswordForm unit={unitName} unitID={unitID} set_dialog_settings={set_dialog_settings}/>
                    <ResetUserPaswordForm unit={unitName} unitID={unitID} set_dialog_settings={set_dialog_settings}/>
                </div>
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

export async function getServerSideProps({ params, req }) {
    const unit = params.unit.toUpperCase()

    const { cookie } = req.headers

    if (!cookie) {
        return {
            redirect: {
                destination: '/admin',
                permanent: false,
            },
        }
    }

    const rootURL = process.env.NODE_ENV == "production" ? process.env.SERVER_URL : 'http://localhost:3000'
    const response = await fetch(`${rootURL}/api/authentication/verifyauthentication?unitName=${unit}&cookieType=AdminAuth`, {
        credentials: "include",
        headers: { cookie },
    })
    
    if (response.status == 401) {
        return {
            redirect: {
                destination: '/admin',
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

    const unit_data_dict = await prisma.Unit.findUnique({
        where: {
            name: unit
        }
    })

    return ({
        props: {
            unitName: unit,
            unitID: unit_data_dict.id
        }
    })
}