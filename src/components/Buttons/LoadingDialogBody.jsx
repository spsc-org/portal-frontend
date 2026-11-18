import {forwardRef} from "react";
import { Spinner } from "@material-tailwind/react"
import { ModalBody } from "../Modal/Modal.jsx"

export const LoadingDialogBody = forwardRef(({isLoading = false, children, ...props}, ref) => {
    return (
        <ModalBody ref={ref} disabled={isLoading} {...props}>
            <span className={isLoading ? "invisible" : "visible"}>{children}</span>
            {isLoading && (
                <span className="absolute">
                    <Spinner />
                </span>
            )}
        </ModalBody>
    );
});
