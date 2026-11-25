import Highlight from "../../../../shared/ui/Highlight.jsx";
import EmptyNote from "./EmptyNote.jsx";

// Порт TableManager.#renderCellIdentifiers() + #renderCellPhoto(); onOpenPhoto — команда ViewModel
const IDENT_ICONS = {
    tax: "fa-regular fa-wallet",
    reg: "fa-light fa-credit-card-front",
    doc: "fa-regular fa-passport",
};

const fileUrl = (path) => `/public-file?path=${encodeURIComponent(path)}`;

const Photos = ({ attachments, onOpenPhoto }) => {
    const photos = (Array.isArray(attachments) ? attachments : []).filter((a) => a.type === "photo");
    if (photos.length === 0) return null;

    const viewerPhotos = photos.map((p) => ({ id: p.id, name: p.original_name, url: fileUrl(p.file_path) }));

    return (
        <div className="mt-1 flex flex-wrap gap-1">
            {photos.map((photo, index) => (
                <button
                    key={photo.id}
                    type="button"
                    title={photo.original_name}
                    onClick={() => onOpenPhoto(viewerPhotos, index)}
                    className="overflow-hidden rounded border border-gray-200 hover:opacity-80 dark:border-gray-600"
                >
                    <img src={fileUrl(photo.file_path)} alt={photo.original_name} loading="lazy" className="h-[4.5rem] w-14 object-cover" />
                </button>
            ))}
        </div>
    );
};

const IdentifiersCell = ({ precomputedData, onOpenPhoto }) => {
    const identifiers = precomputedData?.identifiers;

    return (
        <>
            {Array.isArray(identifiers) && identifiers.length > 0 ? (
                identifiers.map(({ group, caption, value, country, notSpecified }, i) => (
                    <div key={i}>
                        {IDENT_ICONS[group] && <i className={`${IDENT_ICONS[group]} mr-1`} />}
                        {caption}{" "}
                        {notSpecified ? (
                            <span className="italic text-gray-600 dark:text-gray-400">Не задано</span>
                        ) : (
                            <Highlight text={value} />
                        )}
                        {/* Судна — ідентифікатор без країни взагалі, не NULL через помилку */}
                        {country ? ` [${country}]` : ""};
                    </div>
                ))
            ) : (
                <EmptyNote>Немає ідентифікаторів</EmptyNote>
            )}
            <Photos attachments={precomputedData?.attachments} onOpenPhoto={onOpenPhoto} />
        </>
    );
};

export default IdentifiersCell;
