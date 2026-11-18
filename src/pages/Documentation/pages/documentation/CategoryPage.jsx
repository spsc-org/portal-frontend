import { observer } from "mobx-react-lite";
import { Spinner } from "@material-tailwind/react";
import MarkdownRenderer from "../../../../components/MarkdownRenderer.jsx";
import DocumentationSidebar from "../../widgets/DocumentationSidebar/DocumentationSidebar.jsx";

const Body = ({ vm }) => {
    if (vm.isLoading) return <Spinner className="h-6 w-6"/>;
    if (vm.notFound) return <p className="dark:text-gray-400">Категорію «{vm.category}» не знайдено.</p>;
    if (vm.content) return <MarkdownRenderer content={vm.content}/>;
    return <p className="dark:text-gray-400">Оберіть категорію документації.</p>;
};

const CategoryPage = ({ vm }) => (
    <div data-i-doc="page:documentation-category" className="flex min-h-screen">
        <DocumentationSidebar categories={vm.categories} active={vm.activeCategory}/>
        <div className="w-3/4 p-6 prose max-w-none">
            <div className="p-4 max-w-none">
            </div>
            <div className="dark:text-neutral-100">
                <Body vm={vm}/>
            </div>
        </div>
    </div>
);

export default observer(CategoryPage);
