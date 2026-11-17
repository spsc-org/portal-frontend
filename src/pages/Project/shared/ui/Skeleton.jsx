
// Плейсхолдер-смужка для станів завантаження (Portal UI kit: surface-muted, radius-sm).
// width — Tailwind-клас ширини (w-3/4, w-10…); декоративний — прихований від скрінрідерів.
const Skeleton = ({ width = "w-full", height = "h-3", className = "" }) => (
    <span aria-hidden="true" className={`block animate-pulse rounded bg-gray-200 dark:bg-neutral-700 ${width} ${height} ${className}`} />
);

export default Skeleton;
