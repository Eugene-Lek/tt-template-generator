import { Document, Packer, Paragraph, TextRun } from "docx";
import prisma from "@/lib/prisma";

const month_dict = {
    "1": "January",
    "2": "February",
    "3": "March",
    "4": "April",
    "5": "May",
    "6": "June",
    "7": "July",
    "8": "August",
    "9": "September",
    "10": "October",
    "11": "November",
    "12": "December"
}

var format = function (str, col) {
    col = typeof col === 'object' ? col : Array.prototype.slice.call(arguments, 1)

    return str.replace(/\{\{|\}\}|\{(\w+)\}/g, function (m, n) {
        if (m == "{{") { return "{" }
        if (m == "}}") { return "}" }
        return col[n]
    })
}

String.prototype.format = function (col) { return format(this, col) } // Gives string the format method, like in python.

const getRelevantSectionOptions = (form_data, section_name) => {
    return Object.keys(form_data[section_name])
        .filter(option => form_data[section_name][option])
        .map(option => ({ title: option }))
}

const generateOptionParagraph = (template, placeholder_data) => {
    // Lowercase all placeholders in the template to enable case-insensitive formatting.
    // AAdditionally, add whitespace on both sides of the placeholder data insertion.
    // This ensures that placeholder data is separated from the main body even if the admin forgot to do so.
    // Extra spaces will be removed later. 
    let hydrated_template = template.replace(/\{[^}]+\}/g, (matched_placeholder) => {
        const matched_placeholder_no_braces = matched_placeholder.slice(1, -1).toLowerCase()
        if (placeholder_data.hasOwnProperty(matched_placeholder_no_braces)) {
            return ` ${placeholder_data[matched_placeholder_no_braces]} `
        } else {
            return ' ' // If the placeholder was not selected and thus doesnt exist in the data dict, replace it with a whitespace.
        }
    })
    hydrated_template = hydrated_template.replace(/[ \t\r\f\v]+/g, ' ').trim().replace(/[ \.]+\./g, '.') // remove extra spaces and full stops

    const paragraphs = hydrated_template.split(/\n+/g)
    const paragraph_objects = paragraphs.map(paragraph => {
        const textruns = paragraph.split(/(?=\<[^\>]+\>)|(?<=\<[^\>]+\>)/g)
        console.log(textruns)
        const textrun_objects = textruns.map(textrun_template => {
            if (textrun_template.startsWith("<") && textrun_template.endsWith(">")) {
                return new TextRun({ text: textrun_template + ' ', color: "f04e1f", size: 22, font: "Cambria (Body)" })
            } else {
                return new TextRun({ text: textrun_template + ' ', size: 22, font: "Cambria (Body)" })
            }
        })
        console.log(textrun_objects)
        return new Paragraph({ children: textrun_objects, spacing: { after: 200, line: 276 } })
    })
    return paragraph_objects
}

const generateOptionTextRuns = (template, placeholder_data) => {
    // Lowercase all placeholders in the template to enable case-insensitive formatting.
    // AAdditionally, add whitespace on both sides of the placeholder data insertion.
    // This ensures that placeholder data is separated from the main body even if the admin forgot to do so.
    // Extra spaces will be removed later. 
    let hydrated_template = template.replace(/\{[^}]+\}/g, (matched_placeholder) => {
        const matched_placeholder_no_braces = matched_placeholder.slice(1, -1).toLowerCase()
        if (placeholder_data.hasOwnProperty(matched_placeholder_no_braces)) {
            return ` ${placeholder_data[matched_placeholder_no_braces]} `
        } else {
            return ' ' // If the placeholder was not selected and thus doesnt exist in the data dict, replace it with a whitespace.
        }
    })
    hydrated_template = hydrated_template.replace(/[ \t\r\f\v]+/g, ' ').trim().replace(/[ \.]+\./g, '.') // remove extra spaces and full stops
    const textruns = hydrated_template.split(/(?=\<[^\>]+\>)|(?<=\<[^\>]+\>)/g) // generates a list of text which either match or do not match the placeholder pattern
    const textrun_objects = textruns.map(textrun_template => {
        if (textrun_template.startsWith("<") && textrun_template.endsWith(">")) {
            return new TextRun({ text: textrun_template + ' ', color: "f04e1f", size: 22, font: "Cambria (Body)" })
        } else {
            return new TextRun({ text: textrun_template + ' ', size: 22, font: "Cambria (Body)" })
        }
    })
    return textrun_objects
}

export default async function handler(req, res) {
    const { form_data, selected_unit, complusory_fields } = req.body

    // Server-side parameter validation
    const missing_data = Object.keys(form_data).map(field => {
        if (!complusory_fields.includes(field)) {
            return
        }
        if (field != 'Primary Appointments') {
            return form_data[field] == '' ? field : null
        }
        else if (field == 'Primary Appointments') {
            const no_selections = Object.values(form_data[field]).length == 0 ||
                Object.values(form_data[field]).every(selection => !selection) // check if every selection is false
            if (no_selections) {
                return field
            }
        }
    }).filter(field => field) // remove undefined elements
    if (missing_data.length > 0) {
        return res.status(400).json({
            message: `Please provide the following information: 
                                                ${missing_data.map((field, index) => `${index + 1}. ${field}`).join("\n")}`
        })
    }

    // Data Cleaning
    form_data["Rank"] = form_data["Rank"].replace(/\s+/g, ' ').trim().toUpperCase()
    form_data["Full Name"] = form_data["Full Name"].replace(/\s+/g, ' ').trim().toUpperCase()
    form_data["Surname"] = form_data["Surname"].replace(/\s+/g, ' ').trim().toUpperCase()
    let [year, month, day] = form_data['Enlistment Date'].split('-')
    month = month_dict[Number(month)]
    form_data['Enlistment Date'] = `${Number(day)} ${month} ${year}`

    if (req.method == "POST") {
        try {
            // Generate a list of relevant options for each section
            const pre_unit_achievement_options = getRelevantSectionOptions(form_data, "Pre-Unit Achievements")
            const primary_appointment_options = getRelevantSectionOptions(form_data, "Primary Appointments")
            const secondary_appointment_options = getRelevantSectionOptions(form_data, "Secondary Appointments")
            const soldier_fundamentals_options = getRelevantSectionOptions(form_data, "Soldier Fundamentals")
            const other_contributions_options = getRelevantSectionOptions(form_data, "Other Contributions")
            const other_individual_achievements_options = getRelevantSectionOptions(form_data, "Other Individual Achievements")
            // Fetch relevant templates
            const relevant_templates = await prisma.VocationRankCombination.findUnique({
                where: {
                    vocation_rank_unitName: {
                        vocation: form_data["Vocation"],
                        rank: form_data["Rank Category"],
                        unitName: selected_unit
                    }
                },
                select: {
                    PreUnitAchievements: {
                        where: {
                            OR: pre_unit_achievement_options
                        }
                    },
                    Introduction: true,
                    PrimaryAppointments: {
                        where: {
                            OR: primary_appointment_options
                        },
                        include: {
                            achievements: true
                        }
                    },
                    SecondaryAppointments: {
                        where: {
                            OR: secondary_appointment_options
                        }
                    },
                    SoldierFundamentals: {
                        where: {
                            OR: soldier_fundamentals_options
                        }
                    },
                    OtherContributions: {
                        where: {
                            OR: other_contributions_options
                        }
                    },
                    OtherIndividualAchievements: {
                        where: {
                            OR: other_individual_achievements_options
                        }
                    },
                    Conclusion: true
                }
            })
            // Validate the Introduction and Conclusion
            if (!relevant_templates.Introduction) {
                return res.status(400).json({
                    message: `Your S1 department has not keyed-in an Introduction for ${form_data["Vocation"]} ${form_data["Rank Category"]} yet. 
                                                Please contact them about it :(`})
            }
            if (!relevant_templates.Conclusion) {
                return res.status(400).json({
                    message: `Your S1 department has not keyed-in an Conclusion for ${form_data["Vocation"]} ${form_data["Rank Category"]} yet. 
                                                Please contact them about it :(`})
            }
            // Create placholder-data dictionaries (KEYS MUST BE LOWERCASED)
            const standard_placeholders = {
                "rank": form_data["Rank"],
                "full name": form_data["Full Name"],
                "surname": form_data["Surname"],
                "enlistment date": form_data["Enlistment Date"],
                "coy": form_data["Coy"],
                "primary appointment": relevant_templates.PrimaryAppointments.length > 0 ? relevant_templates.PrimaryAppointments[0].title : "<Insert Primary Appointment>"
            }
            const pre_unit_achievement_placeholder_data = Object.fromEntries(
                // Lowercase all placeholders in placeholder_data to enable case-insensitive formatting
                relevant_templates.PreUnitAchievements.map(obj => {
                    const hydrated_template = obj.template.replace(/\{[^}]+\}/g, (matched_placeholder) => {
                        const matched_placeholder_no_braces = matched_placeholder.slice(1, -1).toLowerCase()
                        if (standard_placeholders.hasOwnProperty(matched_placeholder_no_braces)) {
                            return ` ${standard_placeholders[matched_placeholder_no_braces]} `
                        } else {
                            return ' ' // If the placeholder was not selected and thus doesnt exist in the data dict, replace it with a whitespace.
                        }
                    })
                    return [obj.title.toLowerCase(), hydrated_template]
                })
            )
            // Create Transcript and Testimonial paragraph objects
            const introduction_paras = [
                generateOptionTextRuns(relevant_templates.Introduction.transcripttemplate, { ...standard_placeholders, ...pre_unit_achievement_placeholder_data }),
                generateOptionParagraph(relevant_templates.Introduction.template, { ...standard_placeholders, ...pre_unit_achievement_placeholder_data }),
            ]
            let primary_appointment_paras = relevant_templates.PrimaryAppointments?.map(appt_obj => {
                const primary_appointment_achievements = appt_obj.achievements.filter(achievement_obj => {
                    if (typeof form_data["Primary Appointments"][appt_obj.title] === 'object') {
                        // either true, false, or undefined (also false)
                        return form_data["Primary Appointments"][appt_obj.title][achievement_obj.title]
                    } else {
                        // If  form_data["Primary Appointments"][appt_obj.title] is not an object, 
                        // it means none of its corresponding achievements have been selected, so return false
                        return false
                    }
                })
                const primary_appointment_placeholder_data = Object.fromEntries(
                    // Lowercase all placeholders in placeholder_data to enable case-insensitive formatting
                    primary_appointment_achievements.map(obj => {
                        const hydrated_template = obj.template.replace(/\{[^}]+\}/g, (matched_placeholder) => {
                            const matched_placeholder_no_braces = matched_placeholder.slice(1, -1).toLowerCase()
                            if (standard_placeholders.hasOwnProperty(matched_placeholder_no_braces)) {
                                return ` ${standard_placeholders[matched_placeholder_no_braces]} `
                            } else {
                                return ' ' // If the placeholder was not selected and thus doesnt exist in the data dict, replace it with a whitespace.
                            }
                        })
                        return [obj.title.toLowerCase(), hydrated_template]
                    })
                )
                if (form_data["Primary Appointments"][appt_obj.title]) {
                    return [
                        generateOptionTextRuns(appt_obj.transcripttemplate, { ...standard_placeholders, ...primary_appointment_placeholder_data }),
                        generateOptionParagraph(appt_obj.template, { ...standard_placeholders, ...primary_appointment_placeholder_data })
                    ]
                }
            }).filter(element => element) // Remove undefined values
            if (primary_appointment_paras == undefined || primary_appointment_paras.length == 0) {
                // Set the default
                primary_appointment_paras = [[
                    generateOptionTextRuns("<Insert a description of his Primary Appointment>.", standard_placeholders),
                    generateOptionParagraph("<Insert a paragraph about his Primary Appointment>", standard_placeholders)
                ]]
            }
            let secondary_appointment_paras = relevant_templates.SecondaryAppointments?.map(obj => {
                if (form_data["Secondary Appointments"][obj.title]) {
                    // If the above expression is truthy (i.e. true or an object), the option was selected, so return its corresponding templates
                    return [
                        generateOptionTextRuns(obj.transcripttemplate, standard_placeholders),
                        generateOptionParagraph(obj.template, standard_placeholders),
                    ]
                }
            }).filter(element => element) // Remove undefined values
            if (secondary_appointment_paras == undefined || secondary_appointment_paras.length == 0) {
                // Set the default
                secondary_appointment_paras = [[
                    generateOptionTextRuns("<Insert a description of his Secondary Appointment (if any)>.", standard_placeholders),
                    generateOptionParagraph("<Insert a paragraph about his Secondary Appointment (if any)>", standard_placeholders)
                ]]
            }
            let other_contribution_paras = relevant_templates.OtherContributions?.map(obj => {
                if (form_data["Other Contributions"][obj.title]) {
                    // If the above expression is truthy (i.e. true or an object), the option was selected, so return its corresponding templates
                    return [
                        generateOptionTextRuns(obj.transcripttemplate, standard_placeholders),
                        generateOptionParagraph(obj.template, standard_placeholders),
                    ]
                }
            }).filter(element => element) // Remove undefined values
            if (other_contribution_paras == undefined || other_contribution_paras.length == 0) {
                // Set the default
                other_contribution_paras = [[
                    generateOptionTextRuns("<Insert a description of his Other Contributions (if any)>.", standard_placeholders),
                    generateOptionParagraph("<Insert a paragraph about his Other Contributions (if any)>", standard_placeholders)
                ]]
            }
            let other_individual_achievement_paras = relevant_templates.OtherIndividualAchievement?.map(obj => {
                if (form_data["Other Individual Achievements"][obj.title]) {
                    // If the above expression is truthy (i.e. true or an object), the option was selected, so return its corresponding templates
                    return [
                        generateOptionTextRuns(obj.transcripttemplate, standard_placeholders),
                        generateOptionParagraph(obj.template, standard_placeholders),
                    ]
                }
            }).filter(element => element) // Remove undefined values
            if (other_individual_achievement_paras == undefined || other_individual_achievement_paras.length == 0) {
                // Set the default
                other_individual_achievement_paras = [[
                    generateOptionTextRuns("<Insert a description of his Other Individual Achievements (if any)>.", standard_placeholders),
                    generateOptionParagraph("<Insert a paragraph about his Other Individual Achievements (if any)>", standard_placeholders)
                ]]
            }
            const conclusion_paras = [
                generateOptionTextRuns(relevant_templates.Conclusion.transcripttemplate, standard_placeholders),
                generateOptionParagraph(relevant_templates.Conclusion.template, standard_placeholders),
            ]
            // Soldier Fundamentals is an exception because it comes with no admin-provided templates.
            // Instead, each soldier fundamental and its awards are strung together in a pre-defined manner. 
            const soldier_fundamental_award_pairs = [].concat(...relevant_templates.SoldierFundamentals?.map(obj => {
                const soldier_fundamentals_awards = obj.awards.filter(award => {
                    if (typeof form_data["Soldier Fundamentals"][obj.title] === 'object') {
                        // either true, false, or undefined (also false)
                        return form_data["Soldier Fundamentals"][obj.title][award]
                    } else {
                        // If  form_data["Soldier Fundamentals"][obj.title] is not an object, 
                        // it means none of its corresponding awards have been selected, so return false
                        return false
                    }
                })
                return soldier_fundamentals_awards.map(award => [award, obj.title])
            }))
            // Set the default for soldier fundamentals
            if (soldier_fundamental_award_pairs.length > 0) {
                if (soldier_fundamental_award_pairs.length > 1) {
                    var achievement_string = soldier_fundamental_award_pairs.slice(0, -1).map(pair => {
                        return `the ${pair[0]} for his ${pair[1]}`
                    }).join(", ") + `, and the ${soldier_fundamental_award_pairs.slice(-1)[0][0]} for his ${soldier_fundamental_award_pairs.slice(-1)[0][1]}`
                } else {
                    var achievement_string = `the ${soldier_fundamental_award_pairs[0][0]} for his ${soldier_fundamental_award_pairs[0][1]}`
                }
                const soldier_fundamentals_transcript = `In the area of soldier fundamentals, {rank} {surname} has also performed well — he attained ${achievement_string}.`
                const soldier_fundamentals_testimonial = `In the area of soldier fundamentals, {rank} {surname} has also performed well — he attained ${achievement_string}.`
                var soldier_fundamental_paras = [
                    generateOptionTextRuns(soldier_fundamentals_transcript, standard_placeholders),
                    generateOptionParagraph(soldier_fundamentals_testimonial, standard_placeholders),
                ]
            } else {
                var soldier_fundamental_paras = [
                    generateOptionTextRuns("<Insert a description of his Soldier Fundamentals Achievements (if any)>.", standard_placeholders),
                    generateOptionParagraph("<Insert a paragraph about his Soldier Fundamentals Achievements (if any)>", standard_placeholders)
                ]
            }
            console.log(soldier_fundamental_paras)
            const transcript_textruns = [].concat(...[
                introduction_paras[0],
                ...primary_appointment_paras.map(arr => arr[0]),
                ...secondary_appointment_paras.map(arr => arr[0]),
                soldier_fundamental_paras[0],
                ...other_contribution_paras.map(arr => arr[0]),
                ...other_individual_achievement_paras.map(arr => arr[0]),
                conclusion_paras[0]
            ]).filter(element => element) // remove null values
            const testimonial_paragraphs = [].concat(...[
                introduction_paras[1],
                ...primary_appointment_paras.map(arr => arr[1]),
                ...secondary_appointment_paras.map(arr => arr[1]),
                soldier_fundamental_paras[1],
                ...other_contribution_paras.map(arr => arr[1]),
                ...other_individual_achievement_paras.map(arr => arr[1]),
                conclusion_paras[1]
            ]).filter(element => element) // remove null values
            // Build the goddamn word doc (losing my sanity rn)
            console.log(transcript_textruns)
            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: "TRANSCRIPT", bold: true, size: 22, font: "Cambria (Body)" })],
                                spacing: { after: 200, line: 276 }
                            }),
                            new Paragraph({
                                children: transcript_textruns,
                                spacing: { after: 200, line: 276 }
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: "TESTIMONIAL", bold: true, size: 22, font: "Cambria (Body)" })],
                                spacing: { after: 200, line: 276 }
                            }),
                            ...testimonial_paragraphs
                        ]
                    }
                ]
            })
            const b64string = await Packer.toBase64String(doc);
            res.setHeader('Content-Disposition', `attachment; filename=(T&T Template) ${form_data["Rank"]} ${form_data["Full Name"]}.docx`);
            res.send(Buffer.from(b64string, 'base64'));
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: error.message })
        }
    }
}