// Права — як у TableManager.renderTableContent(): редагування — update (не для isDisabled)
// або updateDisabled; видалення — delete (не для isDisabled); копія — create (не для isDisabled).
export const getRowAbilities = (permissions, isDisabled) => ({
    edit: (permissions.update === true && !isDisabled) || Boolean(permissions.updateDisabled),
    remove: permissions.delete === true && !isDisabled,
    copy: Boolean(permissions.create) && !isDisabled,
});
