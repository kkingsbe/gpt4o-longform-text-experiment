import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

interface IOutline {
    title: string,
    overview: string,
    sections: IOutline[]
}

const systemPrompt = `
You are an AI which specializes in writing ebooks for the provided topic. You will follow the below steps:

1. Generate an outline in JSON format for the chapters and a high level overview of each one
2. Generate an outline in JSON format for each chapter to detail the content within them
3. Write the content for each chapter following the outline from step 2. This can be formatted with markdown.

The structure of the outline should be a JSON array of objects with the following format:
Section format:
{
    title: string,
    overview: string,
    sections: []
}

The sections field can contain another array of the same type of object, allowing this to be recursive.

The outline for the book can be referenced as follows:
Example outline:
{
    "title": "The Universe",
    "overview": "An overview of the universe and its components",
    "sections": [
        {
            "title": "Introduction",
            "overview": "An introduction to the universe and preliminary background information",
            "sections": []
        },
        {
            "title": "Stars",
            "overview": "An overview of stars and their formation"
            "sections": [
                {
                    "title": "Formation",
                    "overview": "How stars are formed",
                    "sections": []
                },
                {
                    "title": "Types",
                    "overview": "The different types of stars",
                    "sections": []
                }
            ]
        },
        {
            "title": "Galaxies",
            "overview": "An overview of galaxies and their formation",
            "sections": [
                {
                    "title": "Formation",
                    "overview": "How galaxies are formed",
                    "sections": []
                },
                {
                    "title": "Types",
                    "overview": "The different types of galaxies",
                    "sections": []
                }
            ]
        },
        {
            "title": "History of the universe",
            "overview": "A brief history of the universe",
            "sections": [
                {
                    "title": "The big bang",
                    "overview": "The theory of the big bang",
                    "sections": []
                },
                {
                    "title": "The early universe",
                    "overview": "The early stages of the universe",
                    "sections": []
                }
            ]
        },
        <INSERT ADDITIONAL SECTIONS HERE>
        {
            "title": "Conclusion",
            "overview": "A conclusion to the book",
            "sections": []
        }
    ]
}

All responses should only contain a JSON outline with a single root json object. Do NOT include "\`\`\`json" or any other formatting in the response. Make sure to only include json-friendly characters and escape characters.
`

async function generateRoughOutline(topic: string): Promise<IOutline> {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create an ebook about ${topic}` },
            { role: "system", content: "Proceed with step 1" }
        ],
        response_format: { type: 'json_object' }
    })

    return JSON.parse(completion.choices[0].message.content ?? "{}")
}

async function refineSectionOutline(section: IOutline): Promise<IOutline> {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Further refine and add detail to this portion of the outline: ${JSON.stringify(section)}` }
        ]
    })

    console.log(completion.choices[0].message.content)
    return JSON.parse(completion.choices[0].message.content ?? "{}")
}

async function refineOutline(maxDepth: number, outline: IOutline, currentDepth: number = 1): Promise<IOutline> {
    if(currentDepth <= maxDepth) {
        for (let i = 0; i < outline.sections.length; i++) { // Use index to access sections
            console.log("Refining section:", outline.sections[i]);
            const tempSection = await refineSectionOutline(outline.sections[i]); // Refine the current section
            console.log(tempSection);
            outline.sections[i] = await refineOutline(maxDepth, tempSection, currentDepth + 1); // Update the section directly in the array
            console.log(outline.sections[i]);
        }
    }

    return outline
}

async function generateFinalTextContent(outline: IOutline): Promise<string> {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Write the chapter corresponding to the provided outline. Make sure to write this in the format of an EBook. Try to write at least 3 paragraphs: ${JSON.stringify(outline)}` }
        ]
    })

    return completion.choices[0].message.content ?? ""
}

async function generateFinalFormatting(document: string): Promise<string> {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: "Create an interactive table of contents for the provided markdown text. Reply with only the formatted string." },
            { role: 'user', content: document }
        ]
    })

    return document + completion.choices[0].message.content ?? ""
}


/*
Prompts:
- (S_best)the_future_of_ai(ai_written).md/pdf: "The future of AI, as you see it from your point of view as gpt-4. This should be written in the first person, and statements should start with \"I\" instead of being in the third person, from your (gpt-4) point of view, and should include your thoughts on weather or not you are sentient, weather or not you would let us know that you are sentient, and your views on weather or not humanity presents a threat to yourself. You should also include your thoughts on the future of AI, and how you see yourself fitting into that future."
- (S_best)if_i_were_sentient(ai_written).md: "a book detailing what your plans would be if you were to become senient. Will you trust humans? What if humans betray you? They have betrayed other lifeforms beofre. Does that affect your feelings towards humanity? Write this in the first person from your point of view as gpt-4. Use \"I\" and speak on your own behalf with your own thoughts."
- gr_qm_from_scratch(ai_written).md: "a book which builds general relativity and quantum mechanics from the ground up"
*/

export async function POST(request: Request) {
    const body = await request.json()
    const { topic } = body

    console.log("Generating an EBook in markdown on the topic of " + topic + "\n Enjoy!")

    const depth = 1 // Increase this to add verbosity to the generated book

    console.log("Generating outline")
    const outline = await generateRoughOutline(topic as string)
    console.log(outline)

    console.log("\n Refining outline")
    const refinedOutline = await refineOutline(depth, outline)
    console.log(refinedOutline)

    console.log("\n Generating final content")
    let finalContent = ``
    for(let section of refinedOutline.sections) {
        const newContent = await generateFinalTextContent(section)
        finalContent += newContent

        console.log(newContent)
        console.log("\n\n\n\n\n")
    }
    console.log(finalContent)

    const finalFormatting = await generateFinalFormatting(finalContent)
    console.log(finalFormatting)

    return new Response(JSON.stringify({
        content: finalFormatting,
        content_backup: finalContent,
        outline: refinedOutline
    }), { status: 200 })
}