import "./App.css"
import {HomePage} from "./pages/Home.tsx";
import {NavBar} from "./components/NavBar.tsx";

export default function App() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <NavBar/>
            <HomePage/>
        </div>
    );
}