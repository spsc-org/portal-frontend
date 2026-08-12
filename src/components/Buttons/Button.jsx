const Button = ({
                    onClick,
                    children,
                    iconBefore,
                    disabled = false,
                    color = "primary",
                    size = "md",
                    ...props
                }) => {
    const getColor = (color) => {
        switch (color) {
            case "primary":
            case "secondary":
                return disabled ? "bg-blue-100 dark:text-slate-400" : "bg-blue-500 text-white  dark:bg-blue-800 hover:dark:bg-blue-900 ";
            case "success":
                return disabled ? "bg-green-200 dark:text-lime-500" : "bg-green-500 text-white"
            case "warning":
                return disabled ? "bg-yellow-200 dark:text-amber-300" : "bg-yellow-500 text-white dark:bg-yellow-700 hover:dark:bg-yellow-900 ";
            case "error":
                return disabled ? "bg-red-200 dark:text-red-500" : "bg-red-500 text-white dark:bg-rose-800 hover:dark:bg-rose-900"
            case "white":
                return disabled ? "bg-gray-200" : "bg-white  border broder-slate-400 text-grey-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-500 dark:hover:text-gray-200"
            default:
                return disabled ? "bg-blue-200" : "bg-blue-500 text-white"
        }
    }

    const getPadding = (size) => {
        switch (size) {
            case "xs":
                return 'px-1 py-0.5'
            case "sm":
                return 'px-3 py-2'
            case "md":
                return 'px-4 py-3'
            case "lg":
                return 'px-5 py-4'
            default:
                return 'px-4 py-4'
        }
    }

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`shadow-md flex flex-row  ${getPadding(size)} text-${size} ${getColor(color)}  rounded focus:outline-none`}
            {...props}
        >
            {iconBefore}
            {children}
        </button>
    );
};

export default Button;
