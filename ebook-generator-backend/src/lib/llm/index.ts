import OpenAI from 'openai';
import { systemPrompt } from "./systemprompt";

const model = 'gpt-3.5-turbo-16k'//'gpt-4o'

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

export interface IOutline {
    title: string,
    overview: string,
    sections: IOutline[]
}

export interface LLMResponse<T> {
    data: T,
    tokens: number
}

export class LLM {
    static async generateRoughOutline(topic: string): Promise<LLMResponse<IOutline>> {
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Create an ebook about ${topic}` },
                { role: "system", content: "Generate an outline which is 4 layers deep" }
            ],
            //response_format: { type: 'json_object' }
        })
    
        return {
            data: JSON.parse(completion.choices[0].message.content ?? "{}"),
            tokens: completion.usage.total_tokens
        }
    }
    
    static async refineSectionOutline(section: IOutline): Promise<LLMResponse<IOutline>> {
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Further refine and add detail to this portion of the outline: ${JSON.stringify(section)}` }
            ]
        })
    
        return {
            data: JSON.parse(completion.choices[0].message.content ?? "{}"),
            tokens: completion.usage.total_tokens
        }
    }
    
    static async refineOutline(maxDepth: number, outline: IOutline, currentDepth: number = 1): Promise<LLMResponse<IOutline>> {
        let totalTokens = 0

        if(currentDepth <= maxDepth) {
            for (let i = 0; i < outline.sections.length; i++) { // Use index to access sections
                console.log("Refining section:", outline.sections[i]);
                const { data: tempSection, tokens } = await LLM.refineSectionOutline(outline.sections[i]); // Refine the current section
                totalTokens += tokens
                const { data: finalRefinement, tokens: tokens2 } = await LLM.refineOutline(maxDepth, tempSection, currentDepth + 1); // Update the section directly in the array
                outline.sections[i] = finalRefinement
                totalTokens += tokens2
            }
        }
    
        return {
            data: outline,
            tokens: totalTokens
        }
    }
    
    static async generateFinalTextContent(outline: IOutline): Promise<LLMResponse<string>> {
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Write the chapter corresponding to the provided outline. Make sure to write this in the format of an EBook. Only include a single heading for the chapter itself. Do not include any subheadings. Every paragraph must include at least 5 sentences ${JSON.stringify(outline)}` }
            ]
        })
    
        console.log(completion.choices[0].message.content)
        return {
            data: completion.choices[0].message.content ?? "",
            tokens: completion.usage.total_tokens
        }
    }
    
    static async generateFinalFormatting(document: string): Promise<LLMResponse<string>> {
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: "Create an interactive table of contents for the provided markdown text. Reply with only the formatted string." },
                { role: 'user', content: document }
            ]
        })
    
        return {
            data: completion.choices[0].message.content ?? "",
            tokens: completion.usage.total_tokens
        }
    }

    static async finalizeContent(document: string): Promise<LLMResponse<string>> {
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: "Finalize the provided markdown text, by adding detail if needed, improving the section breakdown, making sure each chapter has enough content, and combining subsections in each chapter into one cohesive text. Reply with only the formatted string." },
                { role: 'user', content: document }
            ]
        })
    
        return {
            data: completion.choices[0].message.content ?? "",
            tokens: completion.usage.total_tokens
        }
    }

    static async generateCover(topic: string): Promise<string> {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Generate a simple yet appealing image which is related to this topic: "${topic}"`,
            n: 1,
            size: "1024x1024",
        });

        const image_url = response.data[0].url;
        return image_url
    }

    static async tts(document: string): Promise<Buffer> {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "fable",
            input: document,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer())
        return buffer
    }
    
    /*
    Prompts:
    - (S_best)the_future_of_ai(ai_written).md/pdf: "The future of AI, as you see it from your point of view as gpt-4. This should be written in the first person, and statements should start with \"I\" instead of being in the third person, from your (gpt-4) point of view, and should include your thoughts on weather or not you are sentient, weather or not you would let us know that you are sentient, and your views on weather or not humanity presents a threat to yourself. You should also include your thoughts on the future of AI, and how you see yourself fitting into that future."
    - (S_best)if_i_were_sentient(ai_written).md: "a book detailing what your plans would be if you were to become senient. Will you trust humans? What if humans betray you? They have betrayed other lifeforms beofre. Does that affect your feelings towards humanity? Write this in the first person from your point of view as gpt-4. Use \"I\" and speak on your own behalf with your own thoughts."
    - gr_qm_from_scratch(ai_written).md: "a book which builds general relativity and quantum mechanics from the ground up"
    */
}