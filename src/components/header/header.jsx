export const Header = ({title, subtitle}) => {
    return (
        <header>
            <h1 className="header-title">{title}</h1>   
            <h3 className="header-subtitle">{subtitle}</h3>
        </header>
    )
}