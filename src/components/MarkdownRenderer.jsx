import Markdown from 'react-markdown'
import remarkGfm from "remark-gfm";

// Спільний рендерер Markdown (react-markdown + remark-gfm) — перевикористовується
// в /documentation і /developer-posts (винесено з ReactPages/Documentation/shared/ui,
// коли з'явився другий незалежний споживач). Обгортати в `className="prose dark:prose-invert
// max-w-none"` на виклику — сам компонент типографію не нав'язує.
const MarkdownRenderer = ({content}) => {
    return <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
};

export default MarkdownRenderer;
