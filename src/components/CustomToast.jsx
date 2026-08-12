import toast from "react-hot-toast";

const CustomToast = ({t, title= "Виникла помилка запиту!", message = ""}) => {
    return (
        <div
            className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
            <div className="flex-1 w-0 p-2">
                <div className="text-md flex items-center gap-x-2 flex-row mb-1">
                    <i className="text-red-600 fa-regular fa-circle-exclamation"></i>
                    <p className="font-medium">
                        {title}
                    </p>
                </div>
                <p className="text-sm font-normal text-gray-900">
                    {message}
                </p>
            </div>
            <div className="flex border-l border-gray-200">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-500 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Закрити
                </button>
            </div>
        </div>
    )
};

export default CustomToast;
