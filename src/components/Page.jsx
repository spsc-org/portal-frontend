import {Fragment} from 'react';
import BackToTop from "./BackToTop.jsx";

/**
 * Обгортка сторінки. Раніше вантажила /api/voc_user у DictionaryContext —
 * тепер словник живе в DictionaryStore і підвантажується за потреби.
 */
const Page = ({children}) => {
    return (
        <Fragment>
            {children}
            <BackToTop/>
        </Fragment>
    );
};

export default Page;
