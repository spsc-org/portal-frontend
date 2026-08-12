import { QueryClient } from "@tanstack/react-query";

// ОДИН QueryClient на всю легасі-сторінку /project, спільний для ВСІХ
// React-острівців, які на ній монтуються (кожен — окремий createRoot(),
// на відміну від Inertia-сторінок, де один QueryClientProvider обгортає
// весь App). Без цього кожен острівець мав би власний ізольований кеш
// react-query, і useProjectOptionsQuery() в різних острівцях (кошик,
// пізніше — список/фільтри тощо) бив би в бекенд окремо для кожного,
// замість одного запиту на сторінку.
//
// Кожен острівець імпортує САМЕ ЦЕЙ інстанс і обгортає себе:
//   <QueryClientProvider client={projectQueryClient}><CartModal/></QueryClientProvider>
export const projectQueryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});
