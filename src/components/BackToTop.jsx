import {useEffect, useState} from "react";
import IconButton from "./Buttons/IconButton.jsx"

const BackToTop = () => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 300);
        };

        const debounceScroll = () => {
            clearTimeout(window.scrollTimeout);
            window.scrollTimeout = setTimeout(handleScroll, 100);
        };

        window.addEventListener("scroll", debounceScroll);
        return () => window.removeEventListener("scroll", debounceScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div
            className={`fixed bottom-10 right-10 z-50 transition-opacity duration-100 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
        >
            <IconButton
                title="Повернутись наверх"
                onClick={scrollToTop}
                className="shadow-lg bg-blue-500 hover:bg-blue-600 rounded-full p-3"
                size="lg"
            >
                <i className="fa-solid fa-up"></i>
            </IconButton>
        </div>
    );
};

export default BackToTop;
