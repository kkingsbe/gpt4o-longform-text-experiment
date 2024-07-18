"use client"

import { Cover } from "@/components/cover/cover";
import { OutlineView } from "@/components/outline/outlineview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import axios from "axios";
import { useRef, useState } from "react";
import Markdown from "react-markdown"
import { Switch } from "@/components/ui/switch"

export interface IOutline {
  title: string,
  overview: string,
  sections: IOutline[]
}

export interface LLMResponse<T> {
  data: T,
  tokens: number
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [outline, setOutline] = useState<IOutline | null>()
  const [path, setPath] = useState<Array<IOutline>>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [finalContent, setFinalContent] = useState<string>("")
  const [cover, setCover] = useState<string>()
  const [poundsOfCoal, setPoundsOfCoal] = useState<number>(0)
  const [viewMode, setViewMode] = useState<"outline" | "content">("outline")

  async function generate() {
    if(loading) return
    setLoading(true)

    let tempPoundsOfCoal = 0

    console.log("Generating cover...")
    setStatus("Generating cover...")
    const tempCover = await generateCover()
    setCover(tempCover)

    console.log("Generating outline...")
    setStatus("Generating outline...")
    const { data: initialOutline, tokens: initialOutlineTokens } = await generateOutline()
    setOutline(initialOutline)
    setPath([initialOutline])
    tempPoundsOfCoal += tokensToPoundsofCoal(initialOutlineTokens)
    setPoundsOfCoal(tempPoundsOfCoal)

    console.log("Refining outline...")
    setStatus("Refining outline...")
    const { data: refinedOutline, tokens: refinedOutlineTokens } = await refineOutline(initialOutline)
    setOutline(refinedOutline)
    setPath([refinedOutline])
    tempPoundsOfCoal += tokensToPoundsofCoal(refinedOutlineTokens)
    setPoundsOfCoal(tempPoundsOfCoal)

    setStatus("Generating content...")
    let fullContent = ""
    for(let section of refinedOutline.sections) {
      const { data: content, tokens: contentTokens} = await generateSectionContent(section)
      fullContent += "\n" + content
      setFinalContent(fullContent)
      tempPoundsOfCoal += tokensToPoundsofCoal(contentTokens)
      setPoundsOfCoal(tempPoundsOfCoal)
      console.log(content)
    }

    // const finalizedConent = await finalizeContent(fullContent)
    // setFinalContent(finalizedConent)

    setStatus("Complete")
    
    setLoading(false)
  }

  async function generateCover(): Promise<string> {
    const { data } = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL! + "/generate/generate-cover", {
      topic: inputRef.current?.value
    })

    return data
  }

  async function generateOutline(): Promise<LLMResponse<IOutline>> {
    const { data } = await axios.post<LLMResponse<IOutline>>(process.env.NEXT_PUBLIC_BACKEND_URL! + "/generate/outline", {
      topic: inputRef.current?.value
    })

    return data
  }

  async function refineOutline(outline: IOutline): Promise<LLMResponse<IOutline>> {
    let totalTokens = 0

    for(let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i]
      setStatus(`Refining section "${section.title}"...`)
      const { data } = await axios.post<LLMResponse<IOutline>>(process.env.NEXT_PUBLIC_BACKEND_URL! + "/generate/refine-section", {
        section
      })

      console.log(data)
      outline.sections[i] = data.data
      totalTokens += data.tokens
    }

    return {
      data: outline,
      tokens: totalTokens
    }
  }

  async function generateSectionContent(section: IOutline): Promise<LLMResponse<string>> {
    setStatus(`Generating content for section "${section.title}"...`)

    const { data } = await axios.post<LLMResponse<string>>(process.env.NEXT_PUBLIC_BACKEND_URL! + "/generate/generate-content", {
      outline: section
    })

    return data
  }

  function tokensToPoundsofCoal(tokens: number): number {
    return tokens * 7.46E-6
  }

  // async function finalizeContent(document: string): Promise<string> {
  //   setStatus("Finalizing content...")
  //   const { data } = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL! + "/generate/finalize-content", {
  //     document
  //   })

  //   return data
  // }

  return (
    <main className="flex min-h-screen flex-col lg:p-24 p-2 gap-20">
      <div className="flex flex-col lg:w-96 w-full gap-2 m-auto border border-border p-5 rounded-xl shadow-lg">
        <Label>Topic Selection</Label>
        <Input
          placeholder="Enter a topic to generate a book for"
          ref={inputRef}
        />
        <Button disabled={loading} onClick={generate}>Generate</Button>
        <p className="text-secondary-foreground text-xs">{poundsOfCoal.toFixed(3)}lb of coal has been used to generate this</p>
        <p className="text-secondary-foreground text-xs">{status}</p>

        {outline && cover && (
        <div className="mt-5 flex flex-row">
          <Switch
            checked={viewMode == "content"}
            onClick={()=>{setViewMode(viewMode == "content" ? "outline" : "content")}}
          />
          <Label className="my-auto ml-2">{viewMode == "content" ? "Document" : "Outline"} View</Label>
        </div>
        )}
      </div>

      <div className="2xl:max-w-[40vw] xl:max-w-[50vw] lg:max-w-[60vw] w-[90vw] mx-auto">
        {viewMode == "outline" && (
          <OutlineView path={path} setPath={setPath} />
        )}

        {viewMode == "content" && (
          <div>
            {outline && cover && (
              <Cover outline={outline} cover={cover} />
            )}

            <Markdown className="markdown-container">
              {finalContent}
            </Markdown>
          </div>
        )}
    </div>
    </main>
  );
}
