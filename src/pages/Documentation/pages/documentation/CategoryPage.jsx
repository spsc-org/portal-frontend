import MarkdownRenderer from "../../../../Components/MarkdownRenderer.jsx";
import DocumentationSidebar from "../../widgets/DocumentationSidebar/DocumentationSidebar.jsx";
import MarkdownTitle from "../../shared/ui/MarkdownTitle.jsx";

const CategoryPage = ({categories, activeCategory, content}) => {
    return (
        <div data-i-doc="page:documentation-category" className="flex min-h-screen">
            <DocumentationSidebar categories={categories} active={activeCategory}/>
            <main className="w-3/4 p-6 prose max-w-none">
                <div className="p-4 max-w-none">
                    {activeCategory && <MarkdownTitle active={activeCategory}/>}
                </div>
                <div className="dark:text-neutral-100">
                    {content ? <MarkdownRenderer content={content}/> : <p className="dark:text-slate-400">Оберіть категорію документації.</p>}

                </div>
            </main>
        </div>
    );
};

export default CategoryPage;
