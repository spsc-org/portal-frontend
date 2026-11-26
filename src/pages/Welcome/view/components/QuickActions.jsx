import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";

const ActionCard = ({ to, icon, title, text, accent = false }) => (
    <Link
        to={to}
        className="flex gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-3 no-underline transition-colors hover:border-blue-500"
    >
        <span
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${
                accent ? "bg-blue-600 text-white" : "bg-neutral-700 text-gray-200"
            }`}
        >
            <i className={`${icon} text-base`} aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-white">{title}</span>
            <span className="text-[13px] leading-[18px] text-gray-400">{text}</span>
        </span>
    </Link>
);

/** Швидкі дії (у темному банері привітання): новий проєкт, остання чернетка форми (якщо є), перехід до подань. */
const QuickActions = () => {
    const vm = useVM();
    const actions = [
        vm.canCreateProject && {
            to: "/project?create=1",
            icon: "fa-regular fa-square-plus",
            title: "Новий проєкт",
            text: "Почати новий список для подання",
            accent: true,
        },
        vm.draftHref && {
            to: vm.draftHref,
            icon: "fa-regular fa-pen-to-square",
            title: "Продовжити чернетку",
            text: "Повернутися до останнього редагування",
        },
        vm.canSeeProposals && {
            to: "/proposal",
            icon: "fa-solid fa-file-export",
            title: "Подання",
            text: "Сформувати документ з готового проєкту",
        },
    ].filter(Boolean);

    if (actions.length === 0) return null;

    return (
        <section aria-label="Швидкі дії" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {actions.map((action) => (
                <ActionCard key={action.title} {...action} />
            ))}
        </section>
    );
};

export default observer(QuickActions);
