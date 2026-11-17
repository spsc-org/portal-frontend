import { useEffect, useId } from 'react'
import { useStores } from '../../stores/storeHooks.js'

const APP_TITLE = 'Portal'

/**
 * Назва сторінки: заголовок вкладки браузера і назва в глобальному Header
 * (ui.pageHeader). `breadcrumbs` — [{ label, href }]; не передано → Header бере їх з меню.
 * Кнопки сторінки в Header — компонент layouts/app/PageHeader.jsx (він викликає цей хук).
 */
export function usePageTitle(title, { breadcrumbs = null, documentTitle = null } = {}) {
  const { ui } = useStores()
  const token = useId()
  const crumbsKey = breadcrumbs ? JSON.stringify(breadcrumbs) : null
  const tabTitle = documentTitle ?? title

  useEffect(() => {
    if (!tabTitle) return undefined
    const previous = document.title
    document.title = `${tabTitle} — ${APP_TITLE}`
    return () => {
      document.title = previous
    }
  }, [tabTitle])

  useEffect(() => {
    if (!title && !crumbsKey) return undefined
    ui.setPageHeader(token, { title: title || null, breadcrumbs: crumbsKey ? JSON.parse(crumbsKey) : null })
    return () => ui.clearPageHeader(token)
  }, [ui, token, title, crumbsKey])
}
