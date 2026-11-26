import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/viewModelHooks.js";
import OwlIllustration from "./OwlIllustration.jsx";
import QuickActions from "./QuickActions.jsx";

/** Темний банер привітання з совою. */
const WelcomeHero = () => {
    const vm = useVM();

    return (
        <section
            aria-label="Привітання"
            className="relative flex flex-wrap items-center gap-8 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 px-8 py-7 text-gray-300 dark:bg-neutral-950"
        >
            <OwlIllustration className="hidden h-52 w-32 flex-none sm:block" />
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                    <p className="m-0 text-[22px] font-bold leading-[30px] text-white">Вітаємо, {vm.userName}</p>
                    <p className="m-0 text-sm text-gray-300">Продовжуйте роботу з проєктами або почніть нове подання.</p>
                    {vm.isDebug && (
                        <span className="mt-2 inline-flex w-fit rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                            Режим розробки
                        </span>
                    )}
                </div>
                <QuickActions />
            </div>
        </section>
    );
};

export default observer(WelcomeHero);
