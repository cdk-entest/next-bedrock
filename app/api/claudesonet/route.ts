import {
  BedrockRuntime,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { NextRequest } from "next/server";

const decoder = new TextDecoder();

const bedrock = new BedrockRuntime({ region: "us-east-1" });

async function* makeIterator(prompt: String) {
  const claudePrompt = `\n\nHuman: ${prompt} \n\nAssistant:`;

  const config = {
    prompt: claudePrompt,
    max_tokens_to_sample: 2048,
    temperature: 0.5,
    top_k: 250,
    top_p: 1,
    stop_sequences: ["\n\nHuman:"],
  };

  // const command = new InvokeModelWithResponseStreamCommand({
  //   // body: JSON.stringify(config),
  //   body: body,
  //   modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
  //   accept: "application/json",
  //   contentType: "application/json",
  // });

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  try {
    console.log("call bedrock ...");
    const response = await bedrock.send(command);
    if (response.body) {
      console.log(response.body);
      for await (const chunk of response.body) {
        if (chunk.chunk) {
          try {
            const json = JSON.parse(decoder.decode(chunk.chunk.bytes));
            console.log(json);
            if (json.type == "content_block_delta") {
              yield json.delta.text;
            }
          } catch (error) {
            console.log(error);
            yield " ";
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

const encoder = new TextEncoder();

export async function GET() {
  const iterator = makeIterator("how to cook chicken soup?");
  const stream = iteratorToStream(iterator);

  return new Response(stream);
}

export async function POST(request: NextRequest) {
  const res = await request.json();
  console.log(res);
  const iterator = makeIterator(res.prompt);
  const stream = iteratorToStream(iterator);
  return new Response(stream);

  // return Response.json({ name: "hai" });
}
