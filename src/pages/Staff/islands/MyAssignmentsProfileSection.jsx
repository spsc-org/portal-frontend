import React from "react";
import {Spinner, ThemeProvider} from "@material-tailwind/react";
import {format} from "date-fns";
import {uk} from "date-fns/locale";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {customTheme} from "../../../theme.js";
import {useMyResponsibleAssignmentsQuery} from "../entities/responsible/queries.js";

// Острівець на легасі-сторінці /profile (Blade, без Inertia) — той самий
// підхід, що CartModalIsland на /project: власний createRoot у app.jsx,
// власний QueryClient (сторінка поза Inertia-деревом, спільного немає — як
// projectQueryClient у Project/entities/project/queryClient.js). Дані — той
// самий ендпоінт, що MyResponsibilities.jsx (Staff/responsible), але з
// датами й підставою — тут це самостійна секція, а не компактний список.
const queryClient = new QueryClient();
const MyAssignmentsSection = () => {
    const {data, isLoading} = useMyResponsibleAssignmentsQuery();
    const assignments = data || [];

    return (
        <div data-i-doc="widget:profile-my-assignments">
            <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-300">
                Мої призначення
            </h2>

            {isLoading && <Spinner className="h-5 w-5"/>}

            {!isLoading && assignments.length === 0 &&
                <p className="text-sm text-gray-500 dark:text-gray-400">Ви поки ні за що не відповідаєте.</p>
            }

            {!isLoading && assignments.length > 0 &&
                <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                    {assignments.map((a) => (
                        <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{a.function?.name || "—"}</p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                З {a.started_at ? format(new Date(a.started_at), "d MMMM yyyy", {locale: uk}) : "—"}
                                {a.reason && <> · {a.reason}</>}
                            </p>
                        </li>
                    ))}
                </ul>
            }
        </div>
    );
};

const MyAssignmentsProfileSection = () => (
    <ThemeProvider value={customTheme}>
        <QueryClientProvider client={queryClient}>
            <MyAssignmentsSection/>
        </QueryClientProvider>
    </ThemeProvider>
);

export default MyAssignmentsProfileSection;
