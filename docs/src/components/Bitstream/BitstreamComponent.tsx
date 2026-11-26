import { ArrowDown, Binary, FlaskConical } from "lucide-react";
import styles from "./BitstreamComponent.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface BitstreamProps {
    isSidebarCollapsed?: boolean;
}

export default function BitstreamComponent({ isSidebarCollapsed = false }: BitstreamProps) {
    const navigate = useNavigate();
    const isCollapsed = isSidebarCollapsed;

    const menuItems = [
        {
            title: "Bitstream",
            collaspIcon: <ArrowDown size={20} />,
            clickEvent: () => navigate("/"),
            icon: <Binary />,
            subMenu: true,
            itemCollasped: useState<boolean>(true),
            subMenuItems: [
                { title: "Benchmark", clickEvent: () => navigate("/"), icon: <FlaskConical /> }
            ]
        },
    ];

    return (
        <ul className={`w-full flex flex-col ${styles.container} ${isCollapsed ? styles.collapsed : ""}`}>
            {menuItems.map((item, index) => {
                const isOpen = item.itemCollasped ? !item.itemCollasped[0] : false;
                return (
                    <li key={index} className={`${isCollapsed ? "w-max" : "w-full"} `}>
                        <div
                            onClick={() => {
                                if (item.itemCollasped) {
                                    item.itemCollasped[1](!item.itemCollasped[0]);
                                } else {
                                    item.clickEvent();
                                }
                            }}
                            className={`${styles.itemsElements}`}>
                            <span className={`${styles.menuIconSpacing}`}>{item.icon}</span>
                            {!isCollapsed && (
                                <p className={styles.menuLabel}>{item.title}</p>
                            )}
                            {!isCollapsed && item.collaspIcon && (
                                <div className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}>
                                    {item.collaspIcon}
                                </div>
                            )}
                        </div>
                        {item.subMenu && (
                            <ul className={`${styles.itemsSubContainer} ${isOpen ? styles.menuOpen : ""}`}>
                                {item.subMenuItems.map((subItem, subIndex) => (
                                    <li key={subIndex} className={`${isCollapsed ? "w-max" : "w-full"} mt-1`}>
                                        <div
                                            onClick={subItem.clickEvent}
                                            className={styles.itemsSubElements}
                                        >
                                            <span className={styles.menuIconSpacing}>{subItem.icon}</span>
                                            {!isCollapsed && (
                                                <p className={styles.menuLabel}>{subItem.title}</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}