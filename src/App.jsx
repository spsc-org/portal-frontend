import { Outlet } from 'react-router'
import CreateIssueGlobalModal from "./components/Modal/CreateIssueGlobalModal.jsx";
import IDocVisibility from "./components/IDocVisibility.jsx";
import {Toaster} from "react-hot-toast";
import {ThemeProvider} from "@material-tailwind/react";
import {customTheme} from "./lib/theme.js";

function App() {
    return (
            <ThemeProvider value={customTheme}>
                <Outlet />
                <CreateIssueGlobalModal />
                <IDocVisibility />
                <Toaster containerStyle={{zIndex: 99999}}/>
            </ThemeProvider>
    )
}

export default App
