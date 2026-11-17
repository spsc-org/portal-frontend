import { useViewModel, ViewModelProvider } from '../../shared/mvvm/index.js';
import { NotificationsViewModel } from './viewmodel/NotificationsViewModel.js';
import NotificationsView from './view/NotificationsView.jsx';

/** Вхід маршруту /notifications: створює VM і віддає її View. */
export default function NotificationsPage() {
    const vm = useViewModel((deps) => new NotificationsViewModel(deps));

    return (
        <ViewModelProvider value={vm}>
            <NotificationsView />
        </ViewModelProvider>
    );
}
