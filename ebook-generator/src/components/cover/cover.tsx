import { IOutline } from "@/app/page"

interface Props {
    outline: IOutline
    cover: string
}

export const Cover: React.FC<Props> = ({ outline, cover }) => {
    return (
        <div className="relative rounded-xl overflow-clip flex w-fit mx-auto">
            <img src={cover}/>
            <div className="absolute left-0 right-0 top-0 bottom-0 bg-gradient-to-tl from-transparent via-transparent via-60% to-black/90 to-80%"/>
            <div className="text-white absolute top-5 left-5 max-w-[50%]">
            <h1 className="text-4xl">{outline.title}</h1>
            <p className="text-sm">{outline.overview}</p>
            </div>
        </div>
    )
}