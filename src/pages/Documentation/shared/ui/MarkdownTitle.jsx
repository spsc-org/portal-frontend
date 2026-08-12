import {Typography} from "@material-tailwind/react";

const MarkdownTitle = ({active = ''}) => {
    return (
        <Typography variant="h5" className="dark:text-neutral-100">{active}</Typography>
    );
};
export default MarkdownTitle;
