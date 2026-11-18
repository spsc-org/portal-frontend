// Chip: use AppChip from @/components/AppChip for auto-truncation (>20 chars)

// Межа border-input (gray-200 / neutral-600), фокус — primary (blue-500 / blue-400)
const FIELD_LABEL = {
    color: "text-gray-600 peer-focus:text-blue-500 dark:text-gray-400 dark:peer-focus:text-blue-400",
    before: "before:border-gray-200 peer-focus:before:!border-blue-500 dark:before:border-neutral-600 dark:peer-focus:before:!border-blue-400",
    after: "after:border-gray-200 peer-focus:after:!border-blue-500 dark:after:border-neutral-600 dark:peer-focus:after:!border-blue-400",
}

/** Тема MT Input/Textarea: base.<el> + outlined.colors.<el|label>.gray (колір за замовчуванням). */
function fieldTheme(el) {
    return {
        styles: {
            base: {
                [el]: {
                    bg: "bg-transparent dark:bg-neutral-900",
                    color: "text-blue-gray-700 dark:text-gray-100",
                },
            },
            variants: {
                outlined: {
                    base: {
                        [el]: {
                            borderColor: "placeholder-shown:border-gray-200 placeholder-shown:border-t-gray-200",
                        },
                    },
                    colors: {
                        [el]: {
                            gray: {
                                borderColor:
                                    "border-gray-200 dark:border-x-neutral-600 dark:border-b-neutral-600 dark:placeholder-shown:border-t-neutral-600",
                                borderColorFocused:
                                    "focus:border-blue-500 dark:focus:border-x-blue-400 dark:focus:border-b-blue-400",
                            },
                        },
                        label: { gray: FIELD_LABEL },
                    },
                },
            },
        },
    }
}

export const customTheme = {
    button: {
        defaultProps: {
            color: 'blue',
            size: 'sm'
        },
        valid: {
            sizes: ['xs', 'sm', 'md', 'lg'],
        },
        styles: {
            sizes: {
                xs: {
                    fontSize: 'text-xs',
                    py: 'py-0.5',
                    px: 'px-1',
                    borderRadius: 'rounded',
                    textTransform: 'none',
                },
                sm: {
                    fontSize: 'text-sm',
                    py: 'py-1',
                    px: 'px-2',
                    borderRadius: 'rounded-md',
                },
            },
        },
    },
    iconButton: {
        styles: {
            sizes: {
                sm: {
                    width: 'w-6',
                    maxWidth: 'max-w-[24px]',
                    height: 'h-6',
                    maxHeight: 'max-h-[24px]',
                    borderRadius: 'rounded-md',
                    fontSize: 'text-xs',
                },
            },
        },
    },
    // Поповери й меню MT рендеряться в портал у body. Без z-index (у теми popover його
    // немає взагалі, у menu — z-[999]) вони опиняються під sticky-шапками таблиць,
    // кастомними оверлеями (z-[1055]) і MT Dialog (zIndex 9999). Шкала шарів:
    //   sticky/Header 10–30 < оверлеї ~1055 < Dialog 9999 = меню react-select < popover/menu 10000 < toast 99999
    popover: {
        styles: {
            base: {
                zIndex: 'z-[10000]',
            },
        },
    },
    menu: {
        styles: {
            base: {
                menu: {
                    zIndex: 'z-[10000]',
                },
            },
        },
    },
    // MT Input/Textarea (outlined) у темній темі — єдине поле kit: фон neutral-900, межа neutral-600,
    // текст gray-100, фокус — primary. Верхню межу MT робить прозорою під «вирізку» плаваючого
    // підпису (її малюють label:before/after), тож dark-межу задаємо по сторонах, а верх —
    // лише коли підпис не піднятий (placeholder-shown).
    input: fieldTheme("input"),
    textarea: fieldTheme("textarea"),
    switch: {
      defaultProps: {
          labelProps: {
              className: 'dark:text-gray-300'
          }
      }
    },
    dialog: {
        defaultProps: {
            className: 'dark:bg-neutral-700',
            dismiss: {
                outsidePress: false,
                escapeKey: true
            }
        },
        styles: {
            base: {
                backdrop: {
                    pointerEvents: 'none',
                }
            }
        }
    },
    dialogHeader: {
        defaultProps: {
            className: "dark:text-gray-200"
        }
    },
    checkbox: {
        defaultProps: {
            className: 'dark:text-gray-100'
        }
    },
    tabs: {
        styles: {
            base: {
                overflow: 'unset'
            }
        }
    },
    tabsBody: {
        styles: {
            base: {
                overflow: 'unset'
            }
        }
    },
}
