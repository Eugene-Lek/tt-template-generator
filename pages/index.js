import Head from 'next/head'
import Select from 'react-select'
import { useState, useEffect } from 'react'
import { Header } from "src/components/header/header"
import { Dialog } from "src/components/home/dialog"
import prisma from '@/lib/prisma'
import ServicemanDetailsForm from '@/src/components/forms/servicemandetailsform'


export default function Home({units}) {
  
  const units_options = units.map(unit=>({label: unit, value: unit}))

  const [selected_unit, set_selected_unit] = useState('')
  const [unit_data , set_unit_data] = useState()

  const [dialog_settings, set_dialog_settings] = useState({
    "message": '',
    "buttons": [],
    "line_props": [],
    "displayed": false,
    "onClickDialog": function(){return},
    "onClickDialogProps": {}           
})

  // Re-query the unit data whenever the selected unit changes
  useEffect(()=>{
    const fetchUnitData = async() => {
      const unit_data_response = await fetch(`/api/unit-data?unit=${selected_unit}`, {
          method: "GET",
          headers: {
              'Content-Type': 'application/json'
          }
      })
      const unit_data_response_data  = await unit_data_response.json()
      set_unit_data(unit_data_response_data.unit_data_dict)
      console.log(unit_data_response_data.unit_data_dict)
    }
    fetchUnitData()

  }, [selected_unit])


  return (
    <>
      <Head>
        <title>T&T Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Header title={"T&T Template Generator"} subtitle={"Write Well-Written, Well-Organised, and Personalised T&Ts"} /> 
        <section className="big-section">
          <h2 className="big-section-title">Select Your Unit</h2>
          <Select 
            instanceId="43b2b7e7-914f-4760-92b9-b1472920ef8e"
            className="select-unit" 
            onChange={option=>set_selected_unit(option.value)} 
            options={units_options} 
            placeholder={"Your Unit"}/>
        </section>
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


export async function getServerSideProps(){
  const unit_names_list = await prisma.Unit.findMany({
    select: {
        name: true
    }
  })  
  const units = unit_names_list.map(obj=>obj.name)
  units.sort()
  return {
      props: {
        units
      }
  }
}