import { CodeSection } from "../components/CodeSection.tsx";
import styles from "./Home.module.css";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <header className={styles.homeHeader}>
            <h1 className={styles.title}>
                Rbxenv (WIP)
            </h1>
            <p className={styles.description}>
                A collection of useful Roblox libraries, tools, <br className="hidden md:inline" />
                and utilities designed to improve development workflows and simplify common tasks.
            </p>
            <div className={styles.buttonContainer}>
                <button
                    onClick={() => navigate("/docs")}
                    className={styles.readDocumentation}
                >
                    Getting Started
                </button>
                <a
                    className={styles.links}
                    href="https://github.com/evxryyy/RbxenvV2TEMPLATE/tree/main"
                    target="_blank"
                    rel="noreferrer"
                >
                    Github
                </a>
            </div>

            <CodeSection />
        </header>
    );
}