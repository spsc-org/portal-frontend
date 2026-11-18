/** Збережені ширини колонок таблиці поточної сторінки (localStorage "{pathname}-column-size"). */
export const loadColumnSizes = () => {
    const savedSizes = localStorage.getItem(`${location.pathname}-column-size`);
    return savedSizes ? JSON.parse(savedSizes) : [];
};
