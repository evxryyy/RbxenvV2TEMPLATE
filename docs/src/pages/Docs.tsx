import { useNavigate } from "react-router-dom";
import styles from "./Docs.module.css"

export default function DocumentationPage() {
    const navigate = useNavigate();
    return (
        <header className={styles.docHeader}>
            <h1 className={styles.title}> Getting Started </h1>
            <div className={styles.buttonContainer}>
                <button
                    onClick={() => navigate("/")}
                    className={styles.returnButton}>
                    Return
                </button>
            </div>
        </header>
    )
}