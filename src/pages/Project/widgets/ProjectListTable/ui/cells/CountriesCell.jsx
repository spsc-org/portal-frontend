import EmptyNote from "./EmptyNote.jsx";

// Порт TableManager.#renderCellCountries() — прапорці з /flag-svg/{iso}.svg
const CountriesCell = ({ precomputedData }) => {
    const countries = precomputedData?.countries;
    if (!Array.isArray(countries) || countries.length === 0) return <EmptyNote>Немає країн</EmptyNote>;

    return (
        <div className="flex flex-col gap-1">
            {countries.map((country) => (
                <span
                    key={country.iso}
                    className="inline-block h-4 w-6 cursor-help rounded-sm border border-gray-300 bg-cover bg-center dark:border-gray-500"
                    style={{ backgroundImage: `url('/flag-svg/${String(country.iso).toLowerCase()}.svg')` }}
                    title={country.name}
                />
            ))}
        </div>
    );
};

export default CountriesCell;
