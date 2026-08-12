// Міст до легасі-сторінки `/project` (resources/js/pages/project.js, `core.js`).
// `myApp` — export class з core.js: Vite шарить її як один спільний chunk між
// entry `app.jsx` (React-острівці) і entry `app_old.js` (легасі), тож
// `myApp.page` тут — та сама інстанція, яку легасі `cartManager.js` викликає
// як `this.pageClass.getItems()` після успішної bulk-дії. Поки паралельний
// кошик не замінив легасі — після кожної успішної дії з React-форми так само
// оновлюємо основну таблицю проєктів, щоб дві корзини не розходились візуально.
import { myApp } from "@/core";

export const refreshLegacyProjectList = () => {
    try {
        myApp.page?.getItems?.();
    } catch (error) {
        console.error("Не вдалося оновити легасі-таблицю проєктів після bulk-дії", error);
    }
};
