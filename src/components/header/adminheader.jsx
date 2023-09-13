import { useRouter } from "next/router"

export const AdminHeader = ({ title, subtitle, unit }) => {
    const router = useRouter()

    const logout = async() => {
        await fetch("/api/authentication/adminlogout")
        router.push("/admin")
    }

    return (
        <>
            <header>
                <h1 className="header-title">{title}</h1>
                <h3 className="header-subtitle">{subtitle}</h3>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'right', gap: "12px" }}>
                    {router.pathname.endsWith("reset-passwords") ? <></> : <a href={`/admin/${unit}/reset-passwords`} style={{ display: "block", backgroundColor: "#01a4d9", fontWeight: "bold", textDecoration: "none", textAlign: "center", width: "180px", border: "0px", borderRadius: "20px", color: "white", fontSize: "20px" }}>Reset Passwords</a>}
                    <button onClick={logout} style={{ display: "block", backgroundColor: "rgb(127 142 146)", fontWeight: "bold", textDecoration: "none", textAlign: "center", width: "90px", border: "0px", borderRadius: "20px", color: "white", fontSize: "20px" }}>Logout</button>
                </div>
            </header>
        </>
    )
}