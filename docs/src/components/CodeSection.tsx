import {RbxtsCodeElement, LuauCodeElement} from "./CodeBlock.tsx"

export function CodeSection() {
    return (
        <section className="flex w-full flex-col items-center px-4 py-12">
            <div className="grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
                <RbxtsCodeElement/>
                <LuauCodeElement/>
            </div>
        </section>
    );
}