// Сова-маскот з макету Welcome (декор героя). Кольори — класи Tailwind (neutral/blue), фон героя завжди темний.
const OwlIllustration = ({ className = "" }) => (
    <svg viewBox="200 200 320 500" aria-hidden="true" className={className}>
        <g className="stroke-neutral-700" strokeWidth="3" strokeLinejoin="round">
            <polygon points="255,305 270,212 322,282" className="fill-neutral-800" />
            <polygon points="465,305 450,212 398,282" className="fill-neutral-800" />
            <path d="M262,445 Q215,540 250,655 Q285,600 292,500 Z" className="fill-neutral-900" />
            <path d="M458,445 Q505,540 470,655 Q435,600 428,500 Z" className="fill-neutral-900" />
            <path d="M262,430 Q230,560 290,672 L430,672 Q490,560 458,430 Q360,462 262,430 Z" className="fill-neutral-800" />
            <path d="M250,300 Q360,250 470,300 Q500,370 470,440 Q360,472 250,440 Q220,370 250,300 Z" className="fill-neutral-800" />
        </g>
        <ellipse cx="360" cy="570" rx="66" ry="86" className="fill-neutral-700/60" />
        <g fill="none" className="stroke-neutral-600" strokeWidth="3" strokeLinejoin="round">
            <path d="M325,515 l17,12 l18,-12 l18,12 l17,-12" />
            <path d="M322,550 l19,12 l19,-12 l19,12 l19,-12" />
            <path d="M325,585 l17,12 l18,-12 l18,12 l17,-12" />
        </g>
        <circle cx="312" cy="365" r="58" className="fill-neutral-700/70" />
        <circle cx="408" cy="365" r="58" className="fill-neutral-700/70" />
        <circle cx="312" cy="365" r="44" className="fill-neutral-900 stroke-blue-500" strokeWidth="4" />
        <circle cx="312" cy="365" r="29" className="fill-blue-700" />
        <circle cx="312" cy="365" r="13" className="fill-neutral-950" />
        <circle cx="319" cy="357" r="5" className="fill-white" />
        <circle cx="408" cy="365" r="44" className="fill-neutral-900 stroke-blue-500" strokeWidth="4" />
        <circle cx="408" cy="365" r="29" className="fill-blue-700/45" />
        <path d="M408,327 v14 M408,389 v14 M370,365 h14 M432,365 h14" className="stroke-blue-300" strokeWidth="3" strokeLinecap="round" />
        <circle cx="408" cy="365" r="12" className="fill-neutral-950" />
        <circle cx="414" cy="358" r="4" className="fill-white" />
        <path d="M348,398 L372,398 L360,426 Z" className="fill-neutral-400" />
        <rect x="216" y="672" width="288" height="20" rx="4" className="fill-neutral-700/60 stroke-blue-500" strokeWidth="3" />
    </svg>
);

export default OwlIllustration;
