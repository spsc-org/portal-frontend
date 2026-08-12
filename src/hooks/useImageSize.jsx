import {useEffect, useState} from "react";

export function useImageSize(src) {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = src;
    }, [src]);

    return size;
}
