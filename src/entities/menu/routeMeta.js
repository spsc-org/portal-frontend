/**
 * Назва сторінки і breadcrumbs із меню сайдбару (resolveMenuItems), без React.
 *
 *  - підпункт меню (/project/upload/v2)      → title "Імпорт", crumbs [Проєкти]
 *  - пункт верхнього рівня (/project)         → title "Проєкти", crumbs []
 *  - сторінка під пунктом (/proposal/12, /report/duplicates) → title null (задає сторінка),
 *    crumbs [..батьки, найближчий пункт]
 *
 * Сторінка може перевизначити і назву, і breadcrumbs через <PageHeader>.
 */
const strip = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

function entries(items) {
  const list = []
  for (const item of items) {
    if (item.href) list.push({ label: item.label, href: strip(item.href), parent: null })
    for (const sub of item.submenu ?? []) {
      if (sub?.href && !sub.disabled) list.push({ label: sub.label, href: strip(sub.href), parent: item })
    }
  }
  return list
}

const crumbOf = (item) => ({ label: item.label, href: item.href ?? null })

export function resolveRouteMeta(items, pathname) {
  const path = strip(pathname)
  const all = entries(items ?? [])
  // Точний збіг: підпункт має пріоритет (у груп href = href першого підпункту)
  const exact = all.find((entry) => entry.href === path && entry.parent) ?? all.find((entry) => entry.href === path)
  if (exact) return { title: exact.label, breadcrumbs: exact.parent ? [crumbOf(exact.parent)] : [] }

  const prefix = all
    .filter((entry) => path.startsWith(`${entry.href}/`))
    .sort((a, b) => b.href.length - a.href.length || Number(Boolean(b.parent)) - Number(Boolean(a.parent)))[0]
  if (prefix) {
    const breadcrumbs = prefix.parent ? [crumbOf(prefix.parent)] : []
    breadcrumbs.push({ label: prefix.label, href: prefix.href })
    return { title: null, breadcrumbs }
  }
  return { title: null, breadcrumbs: [] }
}
