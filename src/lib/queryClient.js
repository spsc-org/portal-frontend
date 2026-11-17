import { QueryClient } from 'mobx-tanstack-query'

// Один QueryClient на весь SPA. QueryClient з mobx-tanstack-query наслідує
// QueryClient з @tanstack/query-core (та сама копія пакета, що й у
// @tanstack/react-query), тож цей самий екземпляр передається і в
// <QueryClientProvider> (для useQuery у ще не перенесених на MVVM
// компонентах), і в MobX Query/Mutation у ViewModel-ах — кеш спільний.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // 4xx (401/403/404/422) повторювати немає сенсу — це не мережевий збій.
      retry: (failureCount, error) => {
        const status = error?.status
        if (status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
  },
})
