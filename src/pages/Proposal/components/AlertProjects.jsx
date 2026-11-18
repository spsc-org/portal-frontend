import {useState} from "react";
import { List, ListItem } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"

export default function AlertProjects({ ignoreAttachAlert }) {
    const [showAll, setShowAll] = useState(false);

    const visibleItems =
        ignoreAttachAlert.length > 3 && !showAll
            ? ignoreAttachAlert.slice(0, 3)
            : ignoreAttachAlert;

    return (
        <>
            {Boolean(ignoreAttachAlert.length) && (
                <div className="p-2 dark:text-gray-300  bg-red-300 dark:bg-red-700 rounded-md">
                    <span className="text-sm">
                        <i className="fa-solid fa-circle-info"></i>{" "}
                        Обрані проєкти вже мають укази. Дані по указ будуть змінено.
                    </span>
                    <List className=" max-h-40 overflow-y-auto">
                        {visibleItems.map((item, index) => (
                            <ListItem
                                onClick={() => window.open(`/project?edit=${item.id}`, "_blank")}
                                key={index}
                                className="hover:bg-blue-200 p-1 dark:hover:bg-blue-500/30 cursor-pointer flex justify-between"
                            >
                                <span className="text-xs">{item?.nameUk || item?.nameEn || "Відсутнє значення"}</span>
                                <i className="fa-solid fa-up-right-from-square"></i>
                            </ListItem>
                        ))}
                    </List>

                    {ignoreAttachAlert.length > 3 && (
                        <Button
                            variant="text"
                            size="sm"
                            className="mt-2"
                            onClick={() => setShowAll(!showAll)}>
                            {showAll ? "Сховати" : "Показати більше"}
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}
