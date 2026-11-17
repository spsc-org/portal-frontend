import { Link } from "react-router";
import { List, ListItem, ListItemPrefix, Typography } from "@material-tailwind/react";

const DocumentationSidebar = ({ categories, active }) => (
    <aside className="w-64 h-screen">
        <div className="mb-2 p-4">
            <Typography variant="h5" className="dark:text-neutral-100">Документація</Typography>
        </div>
        <List className="dark:text-neutral-100 px-0">
            {categories.map((category) => (
                <Link key={category} to={`/documentation/${encodeURIComponent(category)}`}>
                    <ListItem
                        className={`hover:bg-blue-200 dark:hover:bg-blue-500/30 ${
                            active === category ? 'bg-blue-100 dark:bg-blue-400/30 font-semibold' : ''
                        }`}
                    >
                        <ListItemPrefix>
                            <i className={`fa-solid ${active === category ? 'fa-folder-open' : 'fa-folder'}`}></i>
                        </ListItemPrefix>
                        {category}
                    </ListItem>
                </Link>
            ))}
        </List>
    </aside>
);

export default DocumentationSidebar;
