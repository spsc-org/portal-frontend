import { useViewModel, ViewModelProvider } from '../../shared/mvvm/index.js';
import { SettingsViewModel } from './viewmodel/SettingsViewModel.js';
import SettingsView from './view/SettingsView.jsx';

/** Маршрут /settings. */
export default function SettingsPage() {
    const vm = useViewModel((deps) => new SettingsViewModel(deps));

    return (
        <ViewModelProvider value={vm}>
            <SettingsView />
        </ViewModelProvider>
    );
}
