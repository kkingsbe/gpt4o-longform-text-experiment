import { IOutline } from "@/app/page"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb"

interface Props {
    path: Array<IOutline>,
    setPath: (newPath: Array<IOutline>) => void
}

export const OutlineBreadcrumbs: React.FC<Props> = ({ path, setPath }) => {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {path.slice(0,-1).map((section, index) => (
                <>
                    <BreadcrumbItem>
                        <p className="cursor-pointer" onClick={()=>{setPath([...path.slice(0, index-1)])}}>{section.title}</p>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                </>
                ))}

                <BreadcrumbItem>
                    <BreadcrumbPage>{path[path.length-1].title}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )
}