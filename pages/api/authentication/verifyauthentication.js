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
            var { unitName, cookieType } = req.query
            var cookie = req.cookies[cookieType]
        }


        switch (req.method) {
            case "GET":
                try {
                    const payload = jwt.verify(cookie, process.env.JWT_KEY, JWT_OPTIONS);
                    if (payload.unitName != unitName) return res.status(401).json({ message: "User not authenticated. Redirecting to admin login" });
                    return res.status(200).json({ message: "Authentication successful" })

                } catch (error) {
                    return res.status(401).json({ message: "User not authenticated. Redirecting to admin login" });
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