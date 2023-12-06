import { authenticate } from "@/src/authentication";

export default async function handler(req, res) {

    try {
        if (req.method == "GET") {
            var { unitName, cookieType } = req.query
            var cookie = req.cookies[cookieType]
        }


        switch (req.method) {
            case "GET":
                let authenticated = authenticate(unitName, cookie)
                if (!authenticated) {
                    return res.status(401).json({ message: "User has not logged in. Redirecting to login page..." });
                } else {
                    return res.status(200).json({ message: "Authentication successful" })                    
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