import PageHeader from "../layouts/app/PageHeader.jsx";

// Каркас сторінки задач і налаштувань: назва й дії — у глобальному Header (PageHeader),
// контент — тут.
const TaskLayout = ({children, title = null, actions = null, "data-i-doc": dataIDoc}) => {
    return (
        <div className="flex flex-row gap-x-10">
            {(title != null || actions) && <PageHeader title={title} actions={actions}/>}
            {/* min-w-0: дозволяє колонці стискатися (панель перегляду на /task
                інакше виштовхує контент за межі екрана) */}
            <div data-i-doc={dataIDoc} className="mt-2.5 flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
};
export default TaskLayout;
