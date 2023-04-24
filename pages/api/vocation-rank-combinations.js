import prisma from "lib/prisma"
import { v4 as uuidv4 } from "uuid"

export default async function handler(req, res) {
    const { unit, id, vocation, have_officer, have_specialist, have_enlistee } = req.body
    const relevant_ranks = [have_officer ? 'Officer' : '',
    have_specialist ? 'Specialist' : '',
    have_enlistee ? 'Enlistee' : ''].filter(rank => rank) // Remove empty strings
    const all_ranks = ['Officer', 'Specialist', 'Enlistee']
    // Server-Side Parameter Validation
    // If the vocation is an empty string, return an error response
    if (!vocation && req.method != 'DELETE') {
        return res.status(400).json({ message: 'No vocation provided' })
    }
    // If no ranks are provided, return an error response
    if (relevant_ranks.length == 0 && req.method != 'DELETE') {
        return res.status(400).json({ message: 'No ranks selected' })
    }
    try {
        switch (req.method) {
            case "POST":
                // Create a new Vocation Object
                await prisma.Unit.update({
                    where: {
                        name: unit
                    },
                    data: {
                        Vocations: {
                            create: {
                                id: id,
                                name: vocation,
                                ranks: relevant_ranks
                            }
                        }
                    }
                })
                // Iterate through each rank and create a new vocation-rank combination if it doesn't already exist
                relevant_ranks.forEach(async (rank) => {
                    const have_existing_VRC = await prisma.VocationRankCombination.findUnique({
                        where: {
                            vocation_rank_unitName: {
                                vocation: vocation,
                                rank: rank,
                                unitName: unit
                            }
                        }
                    })
                    if (!have_existing_VRC) {
                        await prisma.Unit.update({
                            where: {
                                name: unit
                            },
                            data: {
                                VocationRankCombinations: {
                                    create: {
                                        vocation: vocation,
                                        rank: rank
                                    }
                                }
                            }
                        })
                    }
                })
                res.status(200).json({ message: 'Save Successful' })
                break

            case 'PUT':
                // Update the old vocation object
                await prisma.Vocation.update({
                    where: {
                        id: id
                    },
                    data: {
                        name: vocation,
                        ranks: relevant_ranks
                    }
                })
                // Retrieve the old vocation name (required to update the corresponding Vocation-Rank-Combination Objects)
                const previous_vocation_name_dict = await prisma.Vocation.findUnique({
                    where: {
                        id: id
                    },
                    select: {
                        name: true
                    }
                })
                const previous_vocation_name = previous_vocation_name_dict.name
                // Update the 'vocation' attribute of ALL the Vocation-Rank-Combination objects associated with the
                // old vocation name (even if the rank was not selected in this update request because it could be reselected in the future)
                // If a Vocation-Rank-Combination object does not exist yet, create it.
                all_ranks.forEach(async (rank) => {
                    const have_existing_VRC = await prisma.VocationRankCombination.findUnique({
                        where: {
                            vocation_rank_unitName: {
                                vocation: previous_vocation_name,
                                rank: rank,
                                unitName: unit
                            }
                        }
                    })
                    if (have_existing_VRC) {
                        await prisma.VocationRankCombination.update({
                            where: {
                                vocation_rank_unitName: {
                                    vocation: previous_vocation_name,
                                    rank: rank,
                                    unitName: unit
                                }
                            },
                            data: {
                                vocation: vocation
                            }
                        })
                    } else {
                        await prisma.Unit.update({
                            where: {
                                name: unit
                            },
                            data: {
                                VocationRankCombinations: {
                                    create: {
                                        vocation: vocation,
                                        rank: rank
                                    }
                                }
                            }
                        })
                    }
                })
                res.status(200).json({ message: 'Save Successful' })
                break

            case 'DELETE':
                // Delete the vocation object if it exists
                const vocation_exists = await prisma.Vocation.findUnique({
                    where: {
                        id: id
                    }
                })
                if (vocation_exists) {
                    await prisma.Vocation.delete({
                        where: {
                            id: id
                        }
                    })
                }
                // However, vocation-rank-combi objects will never be deleted.
                // They are persisted forever in order to preserve their connections to templates.
                // This way, if a user were to delete a voction/rank but reverse the change later on,
                // they will not have to manually re-link the vocation/rank to all of its templates. 
                res.status(200).json({ message: 'Delete Successful' })
                break

            default:
                break
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}