

export default function App() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold text-sky-400 mb-4">
                Rbxenv Documentation (WIP)
            </h1>

            <p className="text-slate-400 mb-6">
                A collection of useful Roblox libraries, tools, and utilities designed to improve development workflows and simplify common tasks.
            </p>

            <div className="flex gap-4">
                <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                    Get Started
                </button>
                <button className="border border-slate-700 hover:border-slate-500 text-slate-300 px-4 py-2 rounded-lg">
                    View Benchmarks
                </button>
            </div>
        </div>
    );
}