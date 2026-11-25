import { Logs,Minus,Home,Soup } from "lucide-react";
import styles from "./SideBar.module.css"
import {useState} from "react";
import {useNavigate} from "react-router-dom";

export default function SideBar() {
    const navigate = useNavigate();
    
    const menuItems = [
        {title : "Home", clickEvent : () => navigate("/"), icon : <Home/>},
        {title : "Getting Started", clickEvent : () => navigate("/docs"), icon : <Soup/>}
    ]
    
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`${styles.sideBar} ${isCollapsed ? styles.collapsed : ""}`}>
            <div className={styles.container}>
                <div
                    className={styles.mainElements}
                    onClick={() => setIsCollapsed(!isCollapsed)}>
                    <Logs className={styles.menuIconSpacing} />
                    {!isCollapsed && (
                        <p className={styles.menuLabel}>Navigation</p>
                    )}
                </div>
            </div>
            { /* Separator */ }
            <Minus className={`mt-4 ${isCollapsed ? "m-auto" : "hidden"}`}/>
            <ul className={`${styles.itemsContainer} items-center mt-4`}>
                {menuItems.map((item,index) => (
                    <li key={index} className={`${isCollapsed ? "w-max" : "w-full"}`}>
                        <div 
                            onClick={item.clickEvent}
                            className={`${styles.itemsElements}`}>
                            <span className={styles.menuIconSpacing}>{item.icon}</span>
                            {!isCollapsed && (
                                <p className={styles.menuLabel}>{item.title}</p>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </aside>
    )
}