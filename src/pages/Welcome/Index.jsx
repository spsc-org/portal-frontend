import { useViewModel, ViewModelProvider } from "../../shared/mvvm/index.js";
import { WelcomeViewModel } from "./viewmodel/WelcomeViewModel.js";
import WelcomeView from "./view/WelcomeView.jsx";

/** Маршрут /welcome (і `/` → /welcome, як у web.php). */
export default function WelcomePage() {
    const vm = useViewModel((deps) => new WelcomeViewModel(deps));

    return (
        <ViewModelProvider value={vm}>
            <WelcomeView />
        </ViewModelProvider>
    );
}
