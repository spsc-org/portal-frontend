// Логотип Порталу. Колір — currentColor (за замовчуванням text-blue-400 = #60a5fa, як в оригіналі),
// тож розмір і колір задає className: <PortalLogo className="h-8 w-8" />.
const PortalLogo = ({ className = "h-8 w-8 text-blue-400", title, ...props }) => (
    <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        className={className}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : "true"}
        {...props}
    >
        <path d="M6 12 L7 4 L12 9 H20 L25 4 L26 12 Q28 22 16 28 Q4 22 6 12 Z" />
        <circle cx="11.5" cy="15" r="3.5" />
        <circle cx="20.5" cy="15" r="3.5" />
    </svg>
);

export default PortalLogo;
