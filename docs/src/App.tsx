import "./App.css"

export default function App() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">

            <header className="fixed w-full gap-4 ml-auto mr-auto p-20 zoom-125">

                <h1 className="
                  text-5xl font-bold font-sans
                  bg-linear-to-r from-[#F8FAFC] via-[#38BDF8] to-[#0284C7]
                  bg-clip-text text-transparent
                  bg-[length:200%_auto]
                  text-center
                  mb-4
                  h-max
                  animate-text-scroll
                ">
                    Rbxenv Documentation (WIP)
                </h1>

                <p className="text-slate-400 mb-6 text-center w-full text-2xl">
                    A collection of useful Roblox libraries, tools, <br/>and utilities designed to improve development
                    workflows and simplify common tasks.
                </p>

                <div className="flex flex-col items-center justify-center text-center mb-8">
                    <div className="inline w-full">
                        <button className="
                            bg-sky-700 
                            hover:bg-sky-600
                            text-white 
                            px-4 py-2 
                            rounded-2xl
                            font-semibold transition
                            content-center
                            mr-4
                            cursor-pointer">
                            Read Documentation
                        </button>

                        <a className="
                        bg-zinc-850 
                        border-1
                        border-amber-50
                        text-white 
                        px-4 py-2 
                        rounded-2xl
                        font-semibold transition
                        cursor-pointer select-none"
                           href="https://github.com/evxryyy/RbxenvV2TEMPLATE/tree/main"
                           target="_blank"
                        >
                            Github
                        </a>
                    </div>
                </div>

                <section className="flex w-full flex-col items-center px-4 py-12">
                    <div className="grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">

                        <div
                            className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 shadow-2xl">
                            <pre className="overflow-x-auto p-6 text-left">
                                <code className="font-mono text-sm leading-relaxed text-zinc-300">
                                    <span className="text-zinc-500">// Rbxts </span>
                                    <br/>
                                    <span className="text-rose-400">import</span> Bitstream <span
                                    className="text-rose-400">from</span> 
                                    <span className="text-emerald-400"> "@rbxts/bitstream"</span>
                                    <br/>
                                </code>
                            </pre>
                        </div>

                        <div
                            className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 shadow-2xl">
                            <pre className="overflow-x-auto p-6 text-left">
                                <code className="font-mono text-sm leading-relaxed text-zinc-300">
                                    <span className="text-zinc-500">-- Luau </span>
                                    <br/>
                                    <span className="text-rose-400">const</span> Bitstream <span
                                    className="text-rose-400">=</span>
                                    <span className="text-blue-400"> require<span className="text-zinc-100">(</span>
                                        <span className="text-emerald-400">"RE/Packages/Bitstream"</span>
                                        <span className="text-zinc-100">)</span>
                                    </span>
                                    <br/>
                                </code>
                            </pre>
                        </div>

                        </div>
                </section>

            </header>
        </div>
);
}