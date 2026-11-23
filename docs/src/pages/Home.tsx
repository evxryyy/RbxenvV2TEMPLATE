import {CodeSection} from "../components/CodeSection.tsx";
import styles from "./Home.module.css"

export function HomePage() {
    return (
        <header className={styles.homeHeader}>
            <h1 className={styles.title}>
                Rbxenv Documentation (WIP)
            </h1>

            <p className={styles.description}>
                A collection of useful Roblox libraries, tools, <br/>and utilities designed to improve development
                workflows and simplify common tasks.
            </p>

            <div className={styles.buttonContainer}>
                <div className="inline w-full">
                    <button className={styles.readDocumentation}>
                        Read Documentation
                    </button>

                    <a className={styles.links}
                        href="https://github.com/evxryyy/RbxenvV2TEMPLATE/tree/main"
                        target="_blank"
                    >
                        Github
                    </a>
                </div>
            </div>
            
            <CodeSection />
        </header>
    )
}