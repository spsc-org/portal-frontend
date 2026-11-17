import {subjectType} from "../../../shared/config/subjectTypes.js";

const SIZE_CLASSES = {
    xs: "w-[28px] h-[28px] text-[13px]",
    sm: "w-10 h-10 text-[15px]",
    md: "w-[42px] h-[42px] text-base",
    lg: "w-[54px] h-[54px] text-[21px]",
};

// avatarUrl — реальне фото профілю (sanction_profile_avatar.url), коли завантажене;
// без нього — іконка-плейсхолдер за subjectTypeId (як і раніше).
const SubjectAvatar = ({subjectTypeId, avatarUrl, caption, size = "md"}) => {
    const {icon, avatarClasses} = subjectType(subjectTypeId);
    const sizeClasses = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={caption ?? ""}
                className={`flex-none rounded-full object-cover ${sizeClasses}`}
            />
        );
    }

    return (
        <div className={`flex-none rounded-full flex items-center justify-center ${sizeClasses} ${avatarClasses}`}>
            <i className={icon}></i>
        </div>
    );
};

export default SubjectAvatar;
