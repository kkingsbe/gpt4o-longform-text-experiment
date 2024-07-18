import { IOutline } from "@/app/page"
import { OutlineBreadcrumbs } from "./outlinebreadcrumbs"
import { OutlineViewBase } from "./outlineviewbase"

interface Props {
    path: Array<IOutline>,
    setPath: (newPath: Array<IOutline>) => void
}

export const OutlineView: React.FC<Props> = ({ path, setPath }) => {
    if(path.length > 0) {
        return (
            <div>
                <OutlineBreadcrumbs path={path} setPath={setPath} />
                <OutlineViewBase path={path} setPath={setPath} />
            </div>
        )
    }
}