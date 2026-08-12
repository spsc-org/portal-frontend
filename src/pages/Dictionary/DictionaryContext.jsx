import React, {createContext, useContext, useReducer} from 'react';

// Дії для редуктора
const ACTIONS = {
    SET_DICTIONARY: 'SET_DICTIONARY',
};

// Редуктор для управління станом
const dictionaryReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_DICTIONARY:
            return {...state, dictionary: action.payload};
        default:
            return state;
    }
};

// Створення контексту
const DictionaryContext = createContext();

// Провайдер контексту
export const DictionaryProvider = ({children}) => {
    const [state, dispatch] = useReducer(dictionaryReducer, {dictionary: null});

    // Функції для оновлення стану
    const setDictionary = (newDictionary) => {
        dispatch({type: ACTIONS.SET_DICTIONARY, payload: newDictionary});
    };

    return (
        <DictionaryContext.Provider value={{state, setDictionary}}>
            {children}
        </DictionaryContext.Provider>
    );
};

// Хук для використання контексту
export const useDictionaryContext = () => useContext(DictionaryContext);
