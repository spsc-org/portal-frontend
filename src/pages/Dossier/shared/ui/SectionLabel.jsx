
// Дрібний підпис структурних блоків сторінки (Реєстр досьє / Картка досьє / Реєстр звʼязків /
// Картка звʼязку) — одна каскадна структура (список → деталі) на двох рівнях сторінки,
// тож підписи мають виглядати однаково, а не лише за назвою.
const SectionLabel = ({children}) => (
    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
        {children}
    </div>
);

export default SectionLabel;
