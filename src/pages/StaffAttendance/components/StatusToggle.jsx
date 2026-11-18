import PropTypes from 'prop-types';
import Button from "../../../components/Buttons/Button.jsx"


const StatusToggle = ({ label, value, options, onChange }) => {
    return (
        <div data-i-doc="component:staff-attendance-status-toggle" className="flex flex-col gap-2">
            {label && <label className="block text-sm font-medium text-blue-gray-700">{label}</label>}
            <div className="flex w-fit">
                {options.map((s, i) => {
                    let roundClass = 'rounded-none';
                    if (i === 0) roundClass = 'rounded-l-lg rounded-r-none';
                    else if (i === options.length - 1) roundClass = 'rounded-r-lg rounded-l-none';

                    return (
                        <Button
                            key={s.value}
                            type="button"
                            variant={value === s.value ? "filled" : "outlined"}
                            color={value === s.value ? "blue" : "blue-gray"}
                            onClick={() => onChange(s.value)}
                            size="sm"
                            className={`px-4 py-2 ${roundClass}`}>
                            {s.caption}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

StatusToggle.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        caption: PropTypes.string.isRequired,
    })).isRequired,
    onChange: PropTypes.func.isRequired,
};

export default StatusToggle;
