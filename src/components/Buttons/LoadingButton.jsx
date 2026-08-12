import {Button, Spinner} from "@material-tailwind/react";
import {forwardRef} from "react";

const LoadingButton = forwardRef(({isLoading = false, children, ...props}, ref) => {
    return (
        <Button ref={ref} disabled={isLoading} {...props} className="relative flex items-center justify-center">
            <span className={isLoading ? "invisible" : "visible"}>{children}</span>
            {isLoading && (
                <span className="absolute">
                    <Spinner />
                </span>
            )}
        </Button>
    );
});

export default LoadingButton;
