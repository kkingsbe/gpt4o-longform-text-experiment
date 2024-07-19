import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { IOutline, LLM, LLMResponse } from 'src/lib/llm';

@Controller('generate')
export class GenerateController {
    @Post("outline")
    async generateOutline(@Body("topic") topic: string): Promise<LLMResponse<IOutline>> {
        return await LLM.generateRoughOutline(topic)
    }

    @Post("refine-section")
    async refineSection(@Body("section") section: IOutline): Promise<LLMResponse<IOutline>> {
        return await LLM.refineSectionOutline(section)
    }

    @Post("generate-content")
    async generateContent(@Body("outline") outline: IOutline): Promise<LLMResponse<string>> {
        return await LLM.generateFinalTextContent(outline)
    }

    @Post("finalize-content")
    async finalizeContent(@Body("document") document: string): Promise<LLMResponse<string>> {
        return await LLM.finalizeContent(document)
    }

    @Post("generate-cover")
    async generateCover(@Body("topic") topic: string): Promise<string> {
        return await LLM.generateCover(topic)
    }

    @Post("tts")
    @Header('content-type', 'audio/mpeg')
    async generateTTS(@Body("document") document: string): Promise<Buffer> {
        return await LLM.tts(document)
    }
}
