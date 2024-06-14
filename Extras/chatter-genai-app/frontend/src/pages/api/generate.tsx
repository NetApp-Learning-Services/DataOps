import { getRuntimeEnvVars } from "@/server/env";
import { NextApiRequest, NextApiResponse } from "next";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function POST(req: NextApiRequest, res: NextApiResponse) {

    console.log("POST received at /api/generate");

    if (req.method === 'POST') {
        // Set the appropriate headers for Server Sent Events - SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-store, no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Content-Encoding', 'none' )

        // extract the prompt
        const question = req.body
        console.log("question: " + question);

        const url = getRuntimeEnvVars().SERVER_URL + "/get_answer";
        console.log("url: " + url);
        const response = fetch(url, {
            cache: 'no-store',
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(question),
        });

        response.then((resp) => {

            // if (resp.body && typeof resp.body.getReader === 'function') {
            //     const reader = resp.body.getReader();
            //     const stream = new ReadableStream({
            //         start(controller) {
            //             function push() {
            //                 reader.read().then(({ done, value }) => {
            //                     if (done) {
            //                         controller.close();
            //                         return;
            //                     }
            //                     controller.enqueue(value);
            //                     push();
            //                 });
            //             }
            //             push();
            //         },
            //     });
            //     res.write(stream);
            // }

            const reader = resp.body!.getReader();
            const processStream = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    let chunk = new TextDecoder('utf-8').decode(value)
                    console.log("chunk: " + chunk);

                    if (chunk === "\n") {
                        console.log("chunk is return");
                        continue;
                    }

                    let jsonString = JSON.stringify(chunk);
                    let jsonObject = JSON.parse(jsonString);
                
                    if (jsonObject["answer"] === "") {
                        console.log("illegal json: " + jsonString);
                        continue;
                    }
                    
                    const event = `data: ${jsonString}\n\n`;
                    res.write(event);
                }
            }
            processStream().catch(err => console.log('--stream error--', err));

        });


        // Cleanup function
        req.on('close', () => {
            console.log('close server generate connection');
            res.end();
        });
    } else {
        // Handle other HTTP methods or return an appropriate error response
        res.status(405).json({ error: 'Method Not Allowed' });
    }


}


