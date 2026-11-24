import "./App.css"

// Pages //
import HomePage from "./pages/Home.tsx";
import DocumentationPage from "./pages/Docs.tsx"

// Components //
import {NavBar} from "./components/NavBar.tsx";

import {BrowserRouter, Routes, Route} from "react-router-dom";

export default function App() {
    return (
        <BrowserRouter basename="/RbxenvV2TEMPLATE">
            <div className="min-h-screen bg-zinc-950 text-white">
                <NavBar/>
                
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/docs" element={<DocumentationPage/>}/>
                </Routes>
            </div>
        </BrowserRouter>
    );
}