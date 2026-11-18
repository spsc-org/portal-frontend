import { Link, Navigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import Page from "../../components/Page.jsx";
import ComingSoonPlaceholder from "../../components/SecondaryNav/ComingSoonPlaceholder.jsx";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import { DictionaryPageViewModel } from "./viewmodel/DictionaryViewModels.js";
import DictionaryIdentifyV2 from "./view/DictionaryIdentifyV2.jsx";
import VesselCallSigns from "./view/VesselCallSigns.jsx";

// "Атрибути" — заглушка (в Inertia-версії вкладка була вимкнена)
const AttributesPlaceholder = () => (
    <ComingSoonPlaceholder icon="fa-solid fa-tags" title="Атрибути" description="Словник атрибутів ще не реалізований." />
);

/** Розділи словників — окремі сторінки /dictionary/{section} (посилання — у підменю сайдбару). */
/**
 * /dictionary/identify — легасі-довідник ідентифікаторів (v1), замінений "Ідентифікатори v2".
 * Доступ закрито на рівні UI: дані не вантажаться, лише пояснення й перехід на v2.
 */
const LegacyIdentifiers = () => (
    <section className="mx-auto mt-6 flex max-w-xl flex-col items-center rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm dark:border-amber-800/60 dark:bg-neutral-800/70" data-testid="legacy-page">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <i className="fa-solid fa-lock text-lg" />
        </span>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Сторінка застаріла</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            «Ідентифікатори» (v1) — легасі-довідник. Перегляд і редагування тут закрито, щоб дані не
            розходились із новою версією. Користуйтеся розділом «Ідентифікатори v2».
        </p>
        <Link
            to="/dictionary/identify-v2"
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
            Перейти до «Ідентифікатори v2»
            <i className="fa-solid fa-arrow-right text-xs" />
        </Link>
    </section>
);

const DICTIONARY_SECTIONS = {
    identify: { label: "Ідентифікатори (легасі)", Component: LegacyIdentifiers },
    "identify-v2": { label: "Ідентифікатори v2", Component: DictionaryIdentifyV2 },
    subgroup: { label: "Позивні сигнали судна", Component: VesselCallSigns },
    attributes: { label: "Атрибути", Component: AttributesPlaceholder },
};

const DictionarySection = observer(({ section }) => {
    const vm = useViewModel((deps) => new DictionaryPageViewModel({ ...deps, section }));
    const { label, Component } = DICTIONARY_SECTIONS[section];
    usePageTitle(label, { breadcrumbs: [{ label: "Словники", href: "/dictionary" }], documentTitle: `Словники: ${label}` });
    return (
        <Page>
            <div data-i-doc="page:dictionary" className="p-1">
                <Component page={vm} />
            </div>
        </Page>
    );
});

/** Маршрут /dictionary/:section (pageAccess). Словники countries/subjectTypes — /api/spa/pages/dictionary/options. */
const DictionaryPage = () => {
    const { section } = useParams();
    if (!DICTIONARY_SECTIONS[section]) return <Navigate to="/dictionary/identify-v2" replace />;
    // Новий VM на кожен розділ
    return <DictionarySection key={section} section={section} />;
};

export default DictionaryPage;
