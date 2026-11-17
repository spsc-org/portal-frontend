// Обрізання підпису з трикрапкою (пункти меню, тости)
export const shorten = (text, max) => (text.length > max ? `${text.slice(0, max)}…` : text);
