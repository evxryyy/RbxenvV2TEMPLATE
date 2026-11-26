import "./App.css"

// Pages //
import HomePage from "./pages/Home.tsx";
import DocumentationPage from "./pages/Docs.tsx"

// Components //
import {NavBar} from "./components/NavBar.tsx";
import SideBar from "./components/SideBar.tsx"

import {BrowserRouter, Routes, Route} from "react-router-dom";

export default function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
                <NavBar/>
                <div className={`flex bg-transparent flex-1 w-full`}>
                    <SideBar/>
                    <main className={`flex-1 flex justify-center p-8`}>
                        <Routes>
                            <Route path="/" element={<HomePage/>}/>
                            <Route path="/docs" element={<DocumentationPage/>}/>
                        </Routes>
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
}