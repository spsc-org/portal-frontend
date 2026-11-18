import { useViewModel, ViewModelProvider } from '../../shared/mvvm/index.js';
import { ProfileViewModel } from './viewmodel/ProfileViewModel.js';
import ProfileView from './view/ProfileView.jsx';

/** Маршрут /profile (раніше Blade-сторінка бекенду profile/edit). */
export default function ProfilePage() {
    const vm = useViewModel((deps) => new ProfileViewModel(deps));

    return (
        <ViewModelProvider value={vm}>
            <ProfileView />
        </ViewModelProvider>
    );
}
