import {Search} from "lucide-react";
import styles from "./NavBar.module.css"

function SearchBar() {
    return (
        <div className={styles.searchBar}>
            <Search className={styles.icon} />
            <input
                type="text"
                placeholder="Search..."
                className={styles.inputField}
            />
        </div>
    )
}

export function NavBar() {
    return (
        <header className={styles.navBar}>
            <nav className={styles.navigation}>
                <p className={styles.text}>
                    @Copyright evxryyy 2026-2027
                </p>
                <a href="/"
                   className={styles.ref}>
                    Rbxenv
                </a>
                <SearchBar/>
            </nav>
        </header>        
    )
}