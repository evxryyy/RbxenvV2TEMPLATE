import {
    Logs,
    Minus,
    Home,
    Soup,
    ArrowDown,
    BookOpenCheck,
} from "lucide-react";
import styles from "./SideBar.module.css";
import BitstreamComponent from "./Bitstream/BitstreamComponent.tsx";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SideBar() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    const menuItems = [
        { title: "Home", clickEvent: () => navigate("/"), icon: <Home size={20} /> },
        { title: "Getting Started", clickEvent: () => navigate("/docs"), icon: <Soup size={20} /> },
        {
            title: "API",
            collaspIcon: <ArrowDown size={18} />,
            clickEvent: () => navigate("/docs"),
            icon: <BookOpenCheck size={20} />,
            subMenu: true,
            itemCollasped: useState<boolean>(true),
            subMenuItems: BitstreamComponent
        },
    ];

    return (
        <aside className={`hidden md:flex flex-col ${styles.sideBar} ${isCollapsed ? styles.collapsed : ""}`}>
            <div className={styles.container}>
                <div
                    className={styles.mainElements}
                    onClick={() => setIsCollapsed(!isCollapsed)}>
                    <Logs className={styles.menuIconSpacing} size={20} />
                    {!isCollapsed && (
                        <p className={styles.menuLabel}>Navigation</p>
                    )}
                </div>
            </div>

            {/* Separator */}
            <Minus className={`mt-4 ${isCollapsed ? "mx-auto" : "hidden"}`} />

            <ul className={`${styles.itemsContainer} items-center mt-4`}>
                {menuItems.map((item, index) => {
                    const isOpen = item.itemCollasped ? !item.itemCollasped[0] : false;
                    return (
                        <li key={index} className={`${isCollapsed ? "w-max" : "w-full"}`}>
                            <div
                                onClick={() => {
                                    if (item.itemCollasped) {
                                        item.itemCollasped[1](!item.itemCollasped[0]);
                                    } else {
                                        item.clickEvent();
                                    }
                                }}
                                className={styles.itemsElements}
                            >
                                <span className={styles.menuIconSpacing}>{item.icon}</span>
                                {!isCollapsed && (
                                    <p className={styles.menuLabel}>{item.title}</p>
                                )}
                                {!isCollapsed && item.collaspIcon && (
                                    <div className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}>
                                        {item.collaspIcon}
                                    </div>
                                )}
                            </div>

                            {item.subMenu && item.subMenuItems && (
                                <div className={`${styles.itemsSubContainer} ${isOpen ? styles.menuOpen : ""}`}>
                                    <item.subMenuItems isSidebarCollapsed={isCollapsed} />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}