import {useCallback, useState} from "react";

export const useDialog = () => {
    const [open, setOpen] = useState(false);
    const [props, setProps] = useState(null);

    const handleOpen  = useCallback((props) => {
        setOpen(true);
        setProps(props);
    }, []);

    const handleClose = useCallback(()=> {
        setOpen(false);
        setProps(null);
    }, [])

    return {open: open, handleOpen, handleClose, dialogProps: props};
}
