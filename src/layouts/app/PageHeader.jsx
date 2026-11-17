import { useContext } from 'react'
import { createPortal } from 'react-dom'
import { usePageTitle } from '../../shared/hooks/usePageTitle.js'
import { PageHeaderSlotContext } from './pageHeaderSlot.js'

/**
 * Шапка сторінки в глобальному Header (замість заголовка й кнопок у <main>):
 *
 *   <PageHeader
 *     title="Проєкти"                                          // назва (і заголовок вкладки)
 *     breadcrumbs={[{ label: 'Подання', href: '/proposal' }]}  // за замовчуванням — з меню
 *     actions={<HeaderButton onClick={vm.create}>Додати</HeaderButton>}
 *   />
 *
 * Кнопки рендеряться порталом у слот Header — лишаються в дереві сторінки (useVM, контексти).
 * Сторінкам без кнопок достатньо usePageTitle(title).
 */
export default function PageHeader({ title, breadcrumbs = null, actions = null, documentTitle = null }) {
  const slot = useContext(PageHeaderSlotContext)
  usePageTitle(title, { breadcrumbs, documentTitle })
  return actions && slot ? createPortal(actions, slot) : null
}
