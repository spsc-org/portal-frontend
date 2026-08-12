import {forwardRef} from "react";
import {DialogBody, Spinner} from "@material-tailwind/react";

export const LoadingDialogBody = forwardRef(({isLoading = false, children, ...props}, ref) => {
    return (
        <DialogBody ref={ref} disabled={isLoading} {...props} >
            <span className={isLoading ? "invisible" : "visible"}>{children}</span>
            {isLoading && (
                <span className="absolute">
                    <Spinner />
                </span>
            )}
        </DialogBody>
    );
});
