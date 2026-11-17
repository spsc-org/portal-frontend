import SecondaryNavPanel from "./SecondaryNavPanel.jsx";

// Спільна оболонка для будь-якого простору сторінок з другим боковим меню
// (зараз: /staff, /handbook): контент зліва (росте на всю ширину), меню
// підсторінок — справа, фіксованої ширини. Домен-специфічні Layout-компоненти
// (StaffLayout, HandbookLayout) — тонкі обгортки над цим, кожен передає свій
// `items` (shared/config/navigation.js) і довантажує власні спільні дані
// (напр. StaffLayout викликає useStaffOptions()). Один пункт (чи менше) після
// фільтрації за правами — перемикати нема між чим, панель не рендериться.
const SecondaryNavLayout = ({title, items, active, children, "data-i-doc": dataIDoc}) => {
    if ((items?.length ?? 0) <= 1) {
        return <div data-i-doc={dataIDoc} className="px-3 pb-6 pt-3 sm:px-4">{children}</div>;
    }

    return (
        <div className="flex items-start gap-4 px-3 pb-6 pt-3 sm:px-4">
            <div data-i-doc={dataIDoc} className="min-w-0 flex-1">
                {children}
            </div>
            <SecondaryNavPanel title={title} items={items} active={active}/>
        </div>
    );
};

export default SecondaryNavLayout;
