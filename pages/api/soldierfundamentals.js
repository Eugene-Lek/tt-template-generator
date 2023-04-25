import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"

export default async function handler(req, res) {
    if (req.method != "GET") {
        // 'GET' requests have no 'body'
        var { unit, id, official_name, awards, related_vocation_ranks } = req.body
    }
    if (req.method == 'POST' || req.method == 'PUT') {
        // Parameter Validation   
        if (!official_name) {
            return res.status(400).json({ message: 'The official name is missing' })
        }
        if (Object.keys(related_vocation_ranks).every(rank => related_vocation_ranks[rank].length == 0)) {
            return res.status(400).json({ message: 'This Soldier Fundamental must be assigned to at least 1 vocation-rank combination' })
        }
        if (awards.length == 0 || awards.every(award => award == '')) {
            return res.status(400).json({ message: 'At least 1 award must be provided' })
        }
        // Find related Vocation-Rank-Combination objects via related_vocation_ranks_list
        const related_vocation_ranks_nested_list = Object.keys(related_vocation_ranks).map((vocation) => {
            return related_vocation_ranks[vocation].map((rank) => {
                return { vocation, rank, unitName: unit }
            })
        })
        const related_vocation_ranks_list = [].concat(...related_vocation_ranks_nested_list)
        var related_vocation_ranks_ids = await prisma.VocationRankCombination.findMany({
            where: {
                OR: related_vocation_ranks_list
            },
            select: {
                id: true
            }
        })
    }

    try {
        switch (req.method) {
            case "GET":
                const unit_soldier_fundamentals_dict = await prisma.Unit.findUnique({
                    where: {
                        name: req.query.unit
                    },
                    select: {
                        SoldierFundamentals: {
                            include: {
                                appliesto: true
                            }
                        }
                    }
                })
                const unit_soldier_fundamentals = unit_soldier_fundamentals_dict.SoldierFundamentals
                console.log(unit_soldier_fundamentals)
                if (unit_soldier_fundamentals.length < 1) {
                    var init_list = [{
                        id: uuidv4(),
                        official_name: "",
                        previously_saved_official_name: "",
                        awards: [''],
                        previously_saved_awards: [''],
                        related_vocation_ranks: {},
                        previously_saved_related_vocation_ranks: {},
                        button_state: "save",
                        display: 'block'
                    }]
                } else {
                    var init_list = unit_soldier_fundamentals.map((soldier_fundamental) => {
                        const applies_to_vocation_ranks_entries = soldier_fundamental.appliesto.map(obj => [obj.vocation, obj.rank])
                        const related_vocation_ranks = Object.fromEntries(applies_to_vocation_ranks_entries)
                        Object.keys(related_vocation_ranks).forEach(vocation => {
                            if (typeof related_vocation_ranks[vocation] !== Array) {
                                related_vocation_ranks[vocation] = [related_vocation_ranks[vocation]]
                            }
                        })
                        return {
                            id: soldier_fundamental.id,
                            official_name: soldier_fundamental.title,
                            previously_saved_official_name: soldier_fundamental.title,
                            awards: soldier_fundamental.awards,
                            previously_saved_awards: soldier_fundamental.awards,
                            related_vocation_ranks: related_vocation_ranks,
                            previously_saved_related_vocation_ranks: related_vocation_ranks,
                            button_state: "edit",
                            display: 'block'
                        }
                    })
                }
                res.status(200).json({ init_list, message: "Introdutions Successfully Retrieved" })
                break

            case "POST":
                // Create a new SoldierFundamental Object, instantiated with the related VRC objects
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        SoldierFundamentals: {
                            create: {
                                id: id,
                                title: official_name,
                                awards: awards,
                                appliesto: {
                                    connect: related_vocation_ranks_ids
                                }
                            }
                        }
                    }
                })

                res.status(200).json({ message: 'Save Successful' })
                break

            case 'PUT':
                // Update the old SoldierFundamental object
                await prisma.SoldierFundamental.update({
                    where: {
                        id: id
                    },
                    data: {
                        title: official_name,
                        awards: awards,
                        appliesto: {
                            set: related_vocation_ranks_ids
                        }
                    }
                })
                res.status(200).json({ message: 'Save Successful' })
                break

            case 'DELETE':
                // Delete the SoldierFundamental object and its related achievements if it exists
                const SoldierFundamental_exists = await prisma.SoldierFundamental.findUnique({
                    where: {
                        id: id
                    }
                })
                if (SoldierFundamental_exists) {
                    await prisma.SoldierFundamental.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, SoldierFundamental-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the SoldierFundamental/rank to all of its templates. 
                res.status(200).json({ message: 'Delete Successful' })
                break

            default:
                break
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
