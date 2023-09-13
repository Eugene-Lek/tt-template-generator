import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import jwt from "jsonwebtoken";
import { serialize } from 'cookie'

const JWT_OPTIONS = {
    expiresIn: "1d", // Expires in 1 day
    audience: "ALL_USERS",
    issuer: "30SCE",
    subject: "AUTHENTICATION"
};

export default async function handler(req, res) {
    try {
        if (req.method == "GET") {
            var { current_password, unitID } = req.query
            if (!current_password) { throw new Error("You have not keyed in the password") }
        }

        switch (req.method) {
            case "GET":
                const { userPassword: db_password_hash, id, name } = await prisma.Unit.findUnique({
                    where: {
                        id: unitID
                    }
                })

                const correctPassword = await bcrypt.compare(current_password, db_password_hash)
                if (correctPassword) {
                    const payload = {
                        unitID: id,
                        unitName: name
                    };
                    const cookie = jwt.sign(
                        payload,
                        process.env.JWT_KEY,
                        JWT_OPTIONS
                    )

                    const cookieOptions = {
                        expires: new Date(jwt.decode(cookie).exp * 1000),
                        secure: process.env.NODE_ENV === "production",
                        path: "/" 
                    }

                    res.setHeader('Set-Cookie', serialize('UserAuth', String(cookie), cookieOptions))
                        .send(payload)

                } else {
                    throw new Error("The provided Current Password is wrong.")
                }
                break
            default:
                break
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.message })
    }
}