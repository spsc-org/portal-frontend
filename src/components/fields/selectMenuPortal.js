import { useCallback, useState } from "react"

// Меню react-select виносимо в портал, інакше воно застрягає в stacking context
// предка (sticky-панель фільтрів z-20, картка з overflow/transform) і його
// перекривають sticky-шапки таблиць та інші шари нижче по DOM.
//   - звичайна сторінка → document.body (над Header/sticky, z = SELECT_MENU_Z);
//   - усередині модалки (MT Dialog, role="dialog") → сам dialog: портал у body
//     опинився б під backdrop модалки, а клік по опції MT вважав би "outside
//     press" і закривав модалку.
export const SELECT_MENU_Z = 9999

export function useSelectMenuPortal() {
  const [menuPortalTarget, setTarget] = useState(null)
  const anchorRef = useCallback((node) => {
    if (node) setTarget(node.closest('[role="dialog"]') ?? document.body)
  }, [])
  return { anchorRef, menuPortalTarget }
}

/** Пропси для <Select>: портал + fixed + z-index меню. `styles` злиті з переданими. */
export function selectMenuProps(menuPortalTarget, styles = {}) {
  return {
    menuPortalTarget,
    menuPosition: "fixed",
    styles: {
      ...styles,
      // react-select і з `unstyled` лишає контролу minHeight: 38 (emotion, поза CSS-шаром —
      // перебиває Tailwind). Прибираємо, щоб висоту задавав min-h-* з kitSelectClassNames.
      control: (base, state) => {
        const { minHeight: _minHeight, ...rest } = styles.control ? styles.control(base, state) : base
        return rest
      },
      menuPortal: (base, state) => ({ ...(styles.menuPortal ? styles.menuPortal(base, state) : base), zIndex: SELECT_MENU_Z }),
    },
  }
}
