// Chip: use AppChip from @/components/AppChip for auto-truncation (>20 chars)
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
    switch: {
      defaultProps: {
          labelProps: {
              className: 'dark:text-gray-300'
          }
      }
    },
    dialog: {
        defaultProps: {
            className: 'dark:bg-gray-800',
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
