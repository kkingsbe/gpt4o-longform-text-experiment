import { IOutline } from "@/app/page"

interface Props {
    path: Array<IOutline>,
    setPath: (newPath: Array<IOutline>) => void
}

export const OutlineViewBase: React.FC<Props> = ({ path, setPath }) => {
    return (
        <>
            {path[path.length-1].sections.map((section, index) => (
                <div key={index} onClick={()=>{setPath([...path, section])}} className="flex flex-col mt-5 border border-border p-5 rounded-xl shadow cursor-pointer hover:scale-105 transition-all">
                <h1 className="font-medium text-lg">{section.title}</h1>
                <p className="text-sm text-secondary-foreground">{section.overview}</p>
                <p className="mt-5 text-sm text-secondary-foreground font-light">{`(${section.sections.length} subsections)`}</p>
                </div>
            ))}
        </>
    )
}