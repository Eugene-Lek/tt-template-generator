import jwt from "jsonwebtoken"

const JWT_OPTIONS = {
    expiresIn: "1d", // Expires in 1 day
    audience: "ALL_USERS",
    issuer: "30SCE",
    subject: "AUTHENTICATION"
};

export function authenticate(unit, cookie) {
    try {
        const payload = jwt.verify(cookie, process.env.JWT_KEY, JWT_OPTIONS);
        if (payload.unitName != unit) return false

    } catch (error) {
        return false
    }    

    return true
}

export const tokenExpiredMessage = "Your session token has expired. Please refresh the page and log in again."