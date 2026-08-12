import React, {createContext, useContext, useEffect, useState} from 'react';

const BasketContext = createContext();

export const useBasket = () => useContext(BasketContext);

export const BasketProvider = ({children}) => {
    const [items, setItems] = useState([]);

    // Завантаження з localStorage при старті
    useEffect(() => {
        const storedItems = localStorage.getItem('advancedSearchBasket');
        if (storedItems) {
            try {
                setItems(JSON.parse(storedItems));
            } catch (e) {
                console.error("Failed to parse basket items", e);
            }
        }
    }, []);

    // Збереження в localStorage при зміні
    useEffect(() => {
        localStorage.setItem('advancedSearchBasket', JSON.stringify(items));
    }, [items]);

    const toggleItem = (item) => {
        setItems(prev => {
            const exists = prev.find(i => i.datasetId === item.datasetId && i.id === item.id);
            if (exists) {
                return prev.filter(i => !(i.datasetId === item.datasetId && i.id === item.id));
            } else {
                return [...prev, {
                    datasetId: item.datasetId,
                    id: item.id,
                    addedAt: new Date().toISOString(),
                }];
            }
        });
    };

    const isInBasket = (datasetId, id) => {
        return items.some(i => i.datasetId === datasetId && i.id === id);
    };

    const clearBasket = () => {
        setItems([]);
    };

    return (
        <BasketContext.Provider value={{items, toggleItem, isInBasket, clearBasket}}>
            {children}
        </BasketContext.Provider>
    );
};
