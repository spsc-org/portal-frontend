import Skeleton from "../../../shared/ui/Skeleton.jsx";

// Форма скелета для кожної колонки: кількість рядків тексту й ширини — приблизно як у реальних даних,
// щоб таблиця не "стрибала" по висоті, коли приходять рядки.
const SHAPES = {
    cart: [{ width: "w-3.5", height: "h-3.5" }],
    action: [{ width: "w-4", height: "h-4" }],
    state: [{ width: "w-4", height: "h-4" }],
    type: [{ width: "w-4", height: "h-4" }],
    names: [{ width: "w-11/12" }, { width: "w-3/4" }, { width: "w-1/2" }],
    country: [{ width: "w-6", height: "h-4" }],
    identifiers: [{ width: "w-5/6" }, { width: "w-2/3" }],
    notes: [{ width: "w-3/4" }, { width: "w-5/6" }, { width: "w-1/2" }],
    term: [{ width: "w-10" }],
    restrictions: [{ width: "w-2/3" }],
    categories: [{ width: "w-5/6" }, { width: "w-1/2" }],
    documents: [{ width: "w-3/4" }, { width: "w-full" }, { width: "w-2/3" }],
    performer: [{ width: "w-8" }],
    actions: [],
};

const SkeletonRows = ({ columns, count, cellClassName }) =>
    Array.from({ length: count }, (_, rowIndex) => (
        <tr key={`skeleton-${rowIndex}`} aria-hidden="true">
            {columns.map((column) => (
                <td key={column.key} className={cellClassName}>
                    <div className="flex flex-col gap-1.5 py-0.5">
                        {(SHAPES[column.key] ?? [{ width: "w-3/4" }]).map((shape, i) => (
                            <Skeleton key={i} width={shape.width} height={shape.height} />
                        ))}
                    </div>
                </td>
            ))}
        </tr>
    ));

export default SkeletonRows;
