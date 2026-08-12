import React from "react";
import {Chip} from "@material-tailwind/react";

/**
 * AppChip — transparent wrapper around Material Tailwind <Chip>.
 *
 * If `value` is longer than 20 characters the displayed text is truncated to
 * 20 chars + "…" and the full text is exposed via the native `title` attribute
 * so it appears in a browser tooltip on hover.
 *
 * All other props are forwarded to <Chip> unchanged.
 */
const AppChip = ({value,  sliceLength = 100, ...rest}) => {
    if (typeof value === "string" && value.length > sliceLength) {
        return (
            <Chip
                value={value.slice(0, sliceLength) + "…"}
                title={value}
                {...rest}
            />
        );
    }

    return <Chip value={value} {...rest} />;
};

export default AppChip;
