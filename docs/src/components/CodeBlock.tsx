import styles from "./CodeBlock.module.css"

export function RbxtsCodeElement() {
    return (
        <div
            className={styles.root}>
            <pre>
                <code>
                    <span className="text-zinc-500">// Rbxts </span>
                    <br/>
                    <span className="text-rose-400">import</span> Bitstream <span
                    className="text-rose-400">from</span> 
                    <span className="text-emerald-400"> "@rbxts/bitstream"</span>
                    <br/>
                </code>
            </pre>
        </div>
    );
}

export function LuauCodeElement() {
    return (
        <div
            className={styles.root}>
            <pre>
                <code>
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
    )
}