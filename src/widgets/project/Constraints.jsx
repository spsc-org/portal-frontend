import {useMemo, useState} from "react";
import {Button, Checkbox} from "@material-tailwind/react";
import Input from "../../components/fields/Input.jsx";

const Constraints = ({
                         presentCountries = [],
                         vocabulary = [],
                         subjectTypeId,
                         selectedCheckboxes,
                         readOnly = false,
                         onCheckboxHandler,
                         onInputConstraintChange
                     }) => {

    const initialBoxes = useMemo(() => {
        const getColor = (item) => {
            const isCitizenUa = presentCountries.some(item => item.label === "Україна");
            if (item?.isSpecial) {
                return "bg-orange-400"
            }
            if (item?.subjectTypeId === null) {
                return "bg-green-400"
            }
            // Make red checkbox if subject is a ukrainian citizen
            if (isCitizenUa && item?.subjectTypeId === 1) {
                return "bg-red-400"
            }
            if (item?.subjectTypeId === subjectTypeId) {
                return "bg-green-400"
            } else {
                return "bg-red-400"
            }
        }

        return [...vocabulary].sort((a, b) => a?.order - b?.order).map((item) => {
            return {
                id: `r${item.code}`,
                title: item.caption,
                label: item.code,
                color: getColor(item)
            }
        })
    }, [subjectTypeId, vocabulary, presentCountries]);


    // Локальні зміни чекбоксів поверх selectedCheckboxes; скидаються, коли
    // приходить новий selectedCheckboxes. Без effect: словник обмежень (vocabulary)
    // приходить асинхронно — чекбокси мають з'являтися й тоді.
    const [local, setLocal] = useState({source: selectedCheckboxes, overrides: {}});
    const boxes = useMemo(() => {
        const overrides = local.source === selectedCheckboxes ? local.overrides : {};
        return initialBoxes.map((box) => ({
            ...box,
            // значення 1 у selectedCheckboxes — обрано
            selected: box.id in overrides ? overrides[box.id] : selectedCheckboxes?.[box.id] === 1,
        }));
    }, [initialBoxes, local, selectedCheckboxes]);
    const setBoxes = (updated) => setLocal({
        source: selectedCheckboxes,
        overrides: Object.fromEntries(updated.map((box) => [box.id, box.selected])),
    });

    const handleCheckboxChange = (id) => {
        if (readOnly) return;

        const updatedBoxes = boxes.map((box) =>
            box.id === id ? {...box, selected: !box.selected} : box
        );
        setBoxes(updatedBoxes);
        if (onCheckboxHandler) {
            const updatedSelections = updatedBoxes.reduce((acc, box) => {
                acc[box.id] = box.selected ? 1 : null;
                return acc;
            }, {});

            onCheckboxHandler(updatedSelections);
        }
    };


    const handleSelectAll = () => {
        if (readOnly) return;
        const updatedBoxes = boxes.map((box) => ({...box, selected: true}));
        setBoxes(updatedBoxes)
        if (onCheckboxHandler) {
            const updatedSelections = updatedBoxes.reduce((acc, box) => {
                acc[box.id] = box.selected ? 1 : null;
                return acc;
            }, {});

            onCheckboxHandler(updatedSelections);
        }
    }

    return (
        <div>
            {
                !readOnly &&
                <Button size="sm" onClick={handleSelectAll}>
                    Обрати всі
                </Button>
            }
            <div className="grid grid-cols-8 gap-1">
                {boxes.map((box) => (
                    <div key={box.id} className="flex items-center">
                        <div
                            title={box.title}
                            className={`w-6 h-6 flex rounded-md items-center justify-center text-white font-bold text-[10px]
              ${box?.color ? box.color : "bg-red-500"}`}>
                            {box.label}
                        </div>
                        <Checkbox
                            checked={box.selected}
                            readOnly={readOnly}
                            disabled={readOnly}
                            className={`${readOnly ? "cursor-default" : ""}`}
                            color="blue"
                            onChange={() => handleCheckboxChange(box.id)}
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-start gap-1">
                <div
                    className="w-6 h-6 flex rounded-md items-center justify-center text-white font-bold text-[10px] bg-green-500">
                    6
                </div>
                <Input name="r6Text"
                       placeholder="текст (опційно)"
                       onChange={onInputConstraintChange}
                       disabled={readOnly}
                       value={selectedCheckboxes?.r6Text}
                />
            </div>
            <div className="flex items-start gap-1">
                <div
                    className="w-6 h-6 flex rounded-md items-center justify-center text-white font-bold text-[10px] bg-green-500">
                    25
                </div>
                <Input tag="textarea" name="r25"
                       onChange={onInputConstraintChange}
                       disabled={readOnly}
                       value={selectedCheckboxes?.r25}
                />
            </div>

        </div>
    );
};

export default Constraints;
