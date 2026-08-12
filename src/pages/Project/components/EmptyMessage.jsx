import React from 'react';
import {Typography} from "@material-tailwind/react";

const EmptyMessage = ({size}) => {
    return (<Typography variant="small"
                        className={`dark:text-slate-100 text-size-${size}`}>
        <i className={`text-yellow-600 text-${size} mr-1 fa-regular fa-triangle-exclamation`}></i>
        <span>Значення відсутнє</span>
    </Typography>)
};

export default EmptyMessage;
