"use client"

import { Cover } from "@/components/cover/cover";
import { OutlineView } from "@/components/outline/outlineview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

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

  useEffect(() => {
    toast(status)
  }, [status])

  async function delay(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  async function generate() {
    if(loading) return
    setLoading(true)

    // await tts("Generating your book now. This may take a few minutes. I will provide you with updates as I progress.")
    // await delay(5000)

    let tempPoundsOfCoal = 0

    console.log("Generating cover...")
    setStatus("Generating cover...")
    // await tts("Lets start with generating a cover")
    const tempCover = await generateCover()
    setCover(tempCover)
    // await tts("This should do")
    // await delay(6000)

    console.log("Generating outline...")
    setStatus("Generating outline...")
    // await tts("Next up, generating an outline. I will start with a rough outline and before taking another pass to refine it to make it more detailed. You can view it live below.")
    const { data: initialOutline, tokens: initialOutlineTokens } = await generateOutline()
    setOutline(initialOutline)
    setPath([initialOutline])
    tempPoundsOfCoal += tokensToPoundsofCoal(initialOutlineTokens)
    // await delay(10000)
    // await tts("The initial outline has been generated. I will now refine it to make it more detailed.")
    setPoundsOfCoal(tempPoundsOfCoal)
    // await delay(15000)
    // await tts("Also, just as a sidenote, we have burned " + tempPoundsOfCoal.toFixed(3) + " punds of coal so far. Lets see where it ends up at the end.")

    console.log("Refining outline...")
    setStatus("Refining outline...")
    const { data: refinedOutline, tokens: refinedOutlineTokens } = await refineOutline(initialOutline)
    setOutline(refinedOutline)
    setPath([refinedOutline])
    
    // await delay(10000)
    // await tts("The outline has been refined. I will now generate the content for each section.")
    tempPoundsOfCoal += tokensToPoundsofCoal(refinedOutlineTokens)
    setPoundsOfCoal(tempPoundsOfCoal)

    setStatus("Generating content...")
    setViewMode("content")
    let fullContent = ""
    for(let section of refinedOutline.sections) {
      // await delay(5000)
      // await tts("Next, I will generate the content for the section on " + section.title)
      const { data: content, tokens: contentTokens} = await generateSectionContent(section)
      fullContent += "\n" + content
      setFinalContent(fullContent)
      tempPoundsOfCoal += tokensToPoundsofCoal(contentTokens)
      setPoundsOfCoal(tempPoundsOfCoal)
      console.log(content)
    }

    // await delay(5000)
    // await tts("That looks good to me. I will now read the full document for you. Have a nice day.")

    // await delay(5000)
    // await tts(fullContent.slice(1000, 5000))

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

  async function tts(document: string) {
    const { data } = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL! + "/generate/tts", {
      document
    })

    const buffer = new Uint8Array(data.data);
    const arrayBuffer = buffer.buffer;

    const audioContext = new (window.AudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)
    source.start(0)
  }

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
