import {useSortable} from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';
import AppChip from "../../../components/AppChip";
import {Tooltip} from "@material-tailwind/react";
import {useMemo} from "react";
import {format} from "date-fns";

const SortableItem = ({
                          caption = "",
                          disabledDrag = false,
                          id,
                          item,
                          index,
                          projectStates = [],
                          proposalStates = [],
                          decrees = [],
                      }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id});
    const {nameUk, nameRu, stateId, nameEn, precomputedData, order, createdAt, created_at, decreeId} = item;

    const parsedPrecomputedData = useMemo(() => {
        if (precomputedData) {
            return JSON.parse(precomputedData);
        }
        return null;
    }, [precomputedData])

    const linkedProposal = useMemo(() => {
        const array = parsedPrecomputedData?.proposals;
        if (Array.isArray(array)) {
            return array
                .filter(item => item.caption !== caption)
                .map(item => {
                    const state = proposalStates.find(s => s.id === item.stateId);
                    return {
                        ...item,
                        state: state?.caption,
                        stateStyle: state?.style,
                    };
                });
        }
        return [];
    }, [precomputedData, caption, proposalStates])

    const countries = useMemo(() => {
        const array = parsedPrecomputedData?.countries;
        return Array.isArray(array) ? array : [];
    }, [precomputedData])


    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    const currentState = projectStates.find(s => s.id === stateId);
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group flex mb-1 items-stretch overflow-hidden
                border rounded-[10px]
                transition-all duration-150
                border-[rgba(79,142,247,0.3)] hover:bg-gray-100 bg-gray-50  dark:bg-[rgb(45,_45,_45)] dark:hover:bg-[#1e2536]
                ${isDragging
                ? 'border-[rgba(79,142,247,0.3)] shadow-xl bg-[linear-gradient(135deg,_rgba(79,_142,_247,_0.10),_rgba(79,_142,_247,_0.04))] dark:border-[rgba(79,142,247,0.3)] dark:bg-[linear-gradient(135deg,_rgba(79,_142,_247,_0.10),_rgba(79,_142,_247,_0.04))]'
                : null
            }
            `}
        >
            {/* Left accent bar — visible only when dragging (acts as "selected" indicator) */}
            {isDragging && (
                <div className="w-[3px] bg-[#4f8ef7] rounded-l-[10px] shrink-0"/>
            )}

            {/* Drag handle */}
            {!disabledDrag && (
                <button
                    className="touch-none flex items-center justify-center px-2 shrink-0 cursor-grab
                               text-gray-500 group-hover:text-gray-400 dark:group-hover:text-[#555d72]
                               dark:text-gray-400 transition-colors duration-150"
                    {...attributes}
                    {...listeners}
                >
                    <i className="fa-regular fa-grid-2 text-[13px]"></i>
                </button>
            )}

            {/* Index number */}
            <div className={`flex items-center justify-center w-[22px] shrink-0
                            text-[11px] font-semibold text-gray-400
                            ${disabledDrag ? 'ml-4' : ''}`}>
                {index}
            </div>

            {/* Shuffle icon */}
            <div className="flex items-center w-4 shrink-0">
                {!order &&
                    <Tooltip content="Відсортовано за замовченням">
                        <i className="fa-duotone fa-regular fa-shuffle text-gray-400"></i>
                    </Tooltip>}
            </div>

            {/* State label */}
            {currentState?.caption && (() => {
                const STYLE_TO_CHIP_COLOR = {
                    'text-yellow-400': 'amber',
                    'text-blue-500': 'blue',
                    'text-orange-500': 'orange',
                    'text-red-500': 'red',
                    'text-red-700': 'red',
                    'text-green-500': 'green',
                    'text-pink-500': 'pink',
                };
                const chipColor = STYLE_TO_CHIP_COLOR[currentState.style] ?? 'gray';
                return (
                    <div className="w-[120px]  md:w-[100px] shrink-0 flex items-center px-1">
                        <AppChip
                            value={currentState.caption}
                            color={chipColor}
                            variant="filled"
                            size="sm"
                            sliceLength={12}
                            className="text-[11.5px] font-semibold rounded-full whitespace-normal py-[2px] px-[6px]"
                        />
                    </div>
                );
            })()}

            {/* Main content */}
            <div className="flex-1 min-w-0 py-[10px] pr-1">
                {/* Row 1: title */}
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate
                                     text-black dark:text-[#e8eaf0]
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
                    <span className="text-xs font-medium text-gray-500 dark:text-[#8b91a3]">Країни:</span>
                    {countries.length > 0 ? countries.map((item, index) => (
                        <span key={index}
                              className="text-xs font-medium px-[5px] py-[1px] rounded-[4px] bg-gray-300 text-gray-800 dark:bg-[#2d4170] dark:text-[#c8d8ff]">
                    {item.iso}
                </span>
                    )) : (
                        <span className="text-sm italic text-gray-400 dark:text-[#555d72]">відсутні</span>
                    )}
                </div>

                {/* Decree row */}
                <p className="text-sm text-gray-700 font-semibold dark:text-[#8b91a3] flex items-center gap-1">
                    <i className={`fa-solid fa-file-contract ${decreeId ? 'text-green-400' : 'text-gray-300'}`}></i>
                    {decreeId ? decrees.find(d => d.id === decreeId)?.name :
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
                  <span className={`font-semibold text-[12px] ${item.stateStyle ?? 'text-gray-500'}`}>{item.state}</span>
                  : {displayText}
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
                        <span className="text-sm leading-snug font-medium text-gray-500 dark:text-[#8b91a3]"
                              key={index}>
                            {document?.regNum} {document?.regDate}
                        </span>
                    ))}
            </div>
        </div>
    );
};

export default SortableItem;
