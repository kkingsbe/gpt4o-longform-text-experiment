[Deployment URL](https://aibookwriter-pame25s2b-kkingsbes-projects.vercel.app)

# Welcome
THis is just a simple experiment I made in an afternoon to see if it was feasible to write longer pieces of text with gpt-4o. So far it has been able to write essays of varying levels of detail/length, with a clickable table of contents. Still needs sone prompt adjustment to write in a book format.

## Samples
You can view sample pdfs in the /samples folder. The one labeled `(S_best)` is the best output currently

## Running
To run just install the deps `npm i` and start the server `npm run dev`. Send a post request to `localhost:3000/api/llm` with the topic in the body. Ex: `{ topic: "the future of ai" }`
