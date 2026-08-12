const DictValue = ({item, fallback}) => {
    if (!item) {
        return fallback ?? "—";
    }
    return (
        <span className="inline-flex items-center gap-1.5">
            <i className={`text-[13px] ${item.icon ?? ""} ${item.style ?? ""}`}></i>
            {item.caption}
        </span>
    );
};

export default DictValue;
