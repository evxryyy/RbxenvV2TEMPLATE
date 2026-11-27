import styles from "./Docs.module.css";

export default function DocumentationPage() {
    return (
        <div className="w-full min-w-0">
            <header className={styles.docHeader}>
                <h1 className={styles.title}>Getting Started</h1>

                <div className={styles.overviewLabel}>
                    <p className="leading-relaxed">
                        Originally founded in{" "}
                        <span className="whitespace-nowrap underline font-medium text-white">
                            September 2025
                        </span>{" "}
                        under the initial working title <code className="font-mono text-zinc-200 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 text-sm">OpenEvxEngine</code>,
                        the project transitioned through its beta lifecycle to reach what is now <strong>v2.0</strong>. This major milestone introduces extensive framework rewrites,
                        performance optimizations, and modular architectures designed for modern game development.
                    </p>

                    <p className="leading-relaxed w-full">
                        Built as a fully open-source, developer-first suite, this project is designed for Roblox engineers building scalable experiences.
                        Rather than offering trivial shortcuts, it delivers robust, industrial-grade systems—such as 
                        <code className="font-mono text-zinc-200 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 text-sm">Bitstream</code>,
                        our flagship high-throughput binary serialization engine-enabling developers to master low-level optimization and advanced software patterns.
                    </p>

                    {/* Desktop only */}
                    <p className="hidden md:block">
                        If you are viewing this documentation on a desktop device, use the navigation sidebar on the left or the search bar in the top-right corner to explore available frameworks.
                        Each module includes complete installation guides, full API specifications, and reproducible benchmark suites.
                    </p>

                    {/* Mobile only */}
                    <p className="block md:hidden">
                        If you are browsing from a mobile device, use the search bar at the top to quickly navigate through frameworks, installation guides, complete API references, and benchmark data.
                    </p>
                </div>
            </header>
        </div>
    );
}