import {Typography} from "@material-tailwind/react";

// Двоколонковий каркас сторінки (заголовок + дії, контент нижче) —
// спільний для сторінок задач і налаштувань.
const TaskLayout = ({children, title = null, actions = null, "data-i-doc": dataIDoc}) => {
    return (
        <div className="flex flex-row gap-x-10">
            {/* min-w-0: дозволяє колонці стискатися (панель перегляду на /task
                інакше виштовхує контент за межі екрана) */}
            <div data-i-doc={dataIDoc} className="mt-2.5 flex-1 min-w-0">
                {(title != null || actions) && (
                    <div className="flex justify-between items-center mb-5">
                        {title != null ? (
                            <Typography variant="h6" className="dark:text-neutral-100">{title}</Typography>
                        ) : (
                            <span/>
                        )}
                        {actions}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};
export default TaskLayout;
