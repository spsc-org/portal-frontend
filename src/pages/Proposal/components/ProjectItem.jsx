import React, {useMemo} from "react";
import AppChip from "@/Components/AppChip";
import {format} from "date-fns";

const ProjectItem = ({states, caption, onShowClick, decrees, ...props}) => {
    const {nameUk, nameRu, stateId, nameEn, order, precomputedData, decreeId, createdAt, id} = props;

    const parsedPrecomputedData = useMemo(() => {
        if (precomputedData) {
            return JSON.parse(precomputedData);
        }
        return null;
    }, [precomputedData])

    const linkedProposal = useMemo(() => {
        const array = parsedPrecomputedData?.proposals;
        if (Array.isArray(array)) {
            return array.filter(item => item.caption !== caption).map(item => {
                const state = states.find(s => s.id === item.stateId);
                return {
                    ...item,
                    state: state?.caption,
                    stateStyle: state?.style,
                };
            });
        }
        return [];
    }, [precomputedData, caption])

    const countries = useMemo(() => {
        const array = parsedPrecomputedData?.countries;
        return Array.isArray(array) ? array : [];
    }, [precomputedData]);

    const currentState = states.find(s => s.id === stateId);
    const STYLE_TO_CHIP_COLOR = {
        'text-yellow-400': 'amber',
        'text-blue-500': 'blue',
        'text-orange-500': 'orange',
        'text-red-500': 'red',
        'text-red-700': 'red',
        'text-green-500': 'green',
        'text-pink-500': 'pink',
    };
    const chipColor = STYLE_TO_CHIP_COLOR[currentState?.style] ?? 'gray';

    return (
        <div
            className="
                group flex mb-1 items-stretch overflow-hidden
                border rounded-[10px]
                transition-all duration-150
                border-[rgba(79,142,247,0.3)] hover:bg-gray-100 bg-gray-50  dark:bg-[rgb(45,_45,_45)] dark:hover:bg-[#1e2536]">

            {/* Order number */}
            <div
                className="flex items-center justify-center w-[22px] shrink-0 text-[11px] font-semibold text-gray-400 dark:text-[#555d72]">
                {order}
            </div>

            {/* State label */}
            {currentState?.caption && (
                <div className="w-[60px] md:w-[100px] shrink-0 flex items-center px-1">
                    <AppChip
                        value={currentState.caption}
                        color={chipColor}
                        variant="filled"
                        size="sm"
                        sliceLength={12}
                        className="text-[11.5px] font-semibold rounded-full whitespace-normal py-[2px] px-[6px]"
                    />
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 min-w-0 py-[10px] pr-1">
                {/* Row 1: title */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-md leading-none
                                     text-gray-800 dark:text-[#e8eaf0]
                                     group-hover:text-[#1d3461] dark:group-hover:text-[#c9d8ff]
                                     transition-colors duration-150">
                        {nameUk || nameRu || nameEn}
                    </span>
                </div>

                {/* Row 2: ID + date */}
                <div className="flex items-center gap-2 mb-[5px]">

                      <span className="text-xs font-medium text-gray-800 dark:text-gray-100">
                        ID: {id}
                    </span>
                    <span className="text-xs font-medium  text-gray-800 dark:text-gray-100 ">
                        Створено: {format(createdAt || created_at, "dd.MM.yyyy HH:mm")}
                    </span>
                </div>

                {/* Row 3: countries */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-gray-500 dark:text-[#8b91a3]">Країни:</span>
                    {countries.length > 0 ? countries.map((item, index) => (
                        <span key={index}
                              className="text-sm font-medium px-[5px] py-[1px] rounded-[4px] bg-gray-300 text-gray-800 dark:bg-[#2d4170] dark:text-[#c8d8ff]">
                            {item.iso}
                        </span>
                    )) : (
                        <span className="text-xs italic text-gray-400 dark:text-[#555d72]">відсутні</span>
                    )}
                </div>

                {/* Decree row (ProjectItem-specific) */}
                <p className="text-sm text-gray-700 font-semibold dark:text-[#8b91a3] flex items-center gap-1">
                    <i className={`fa-solid fa-file-contract ${Boolean(decreeId) ? 'text-green-400' : 'text-gray-300'}`}></i>
                    {Boolean(decreeId) ? decrees.find(d => d.id === decreeId)?.name :
                        <span className="italic">Указ відсутній</span>
                    }
                </p>
            </div>

            {/* Linked proposals */}
            <div
                className="text-sm mr-1  font-semibold text-gray-500 dark:text-[#8b91a3] flex-1 min-w-0 flex flex-col items-start gap-0.5 py-[10px] pr-1">
                {linkedProposal.length > 0 && (
                    <>
                        {linkedProposal.map((item, index) => {
                            const isLongText = item.caption.length > 80;
                            const displayText = isLongText ? `${item.caption.slice(0, 80)}...` : item.caption;
                            return (
                                <span title={item.caption} key={index}>
                                    <span
                                        className={`font-semibold text-[10px] ${item.stateStyle ?? 'text-gray-500'}`}>{item.state}</span>: <span className="font-normal text-[12px]">{displayText}</span>
                                </span>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Documents */}
            <div className="w-[20%] shrink-0 flex flex-col gap-0.5 justify-center">
                {Boolean(parsedPrecomputedData?.documents) &&
                    parsedPrecomputedData?.documents?.map((document, index) => (
                        <span className="text-sm leading-1 font-medium text-gray-500 dark:text-[#8b91a3] flex items-center gap-1"
                              key={index}>
                            {document?.regNum} {document?.regDate}
                        </span>
                    ))}
            </div>
        </div>
    );
};

export default ProjectItem;
