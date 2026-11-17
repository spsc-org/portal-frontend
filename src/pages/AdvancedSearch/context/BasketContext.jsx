import { useVM } from "../../../shared/mvvm/viewModelHooks.js";

/**
 * Кошик "вибраних" записів — SearchBasket у AdvancedSearchViewModel
 * (localStorage advancedSearchBasket). Компоненти, що його читають, — observer().
 */
export const useBasket = () => useVM().basket;
