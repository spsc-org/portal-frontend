import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router";
import { Button } from "@material-tailwind/react";
import Page from "../../../components/Page.jsx";
import SingleSelect from "../../../components/fields/SingleSelect.jsx";

const StatisticFormView = ({ vm }) => {
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        if (vm.canSubmit) navigate(vm.resultPath);
    };

    return (
        <Page>
            <div data-i-doc="page:statistic" className="max-w-md mx-auto mt-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <p className="mb-4 text-sm font-medium text-gray-600 dark:text-slate-300">Нереалізовані проєкти</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
                    <div>
                        <label htmlFor="year" className="block text-sm text-gray-500 dark:text-gray-300">Рік</label>
                        <input
                            id="year"
                            type="number"
                            min="2000"
                            max="2100"
                            required
                            value={vm.year}
                            onChange={(e) => vm.setYear(e.target.value)}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200"
                        />
                    </div>
                    <SingleSelect
                        label="Критерій"
                        id="type"
                        options={vm.typeOptions}
                        value={vm.type}
                        onChange={vm.setType}
                        closeMenuOnSelect
                    />
                    <Button type="submit" className="mt-2">Переглянути</Button>
                </form>
            </div>
        </Page>
    );
};

export default observer(StatisticFormView);
