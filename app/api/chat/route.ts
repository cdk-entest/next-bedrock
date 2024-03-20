import {
  BedrockRuntime,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { AWSBedrockAnthropicStream, StreamingTextResponse } from "ai";
import { experimental_buildAnthropicPrompt } from "ai/prompts";

// IMPORTANT! Set the runtime to edge
// export const runtime = "edge";

const bedrockClient = new BedrockRuntime({
  region: "us-east-1",
  // region: process.env.AWS_REGION ?? "us-east-1",
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  //   sessionToken: process.env.AWS_SESSION_TOKEN ?? "",
  // },
});

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { messages } = await req.json();

  console.log(messages);

  console.log(experimental_buildAnthropicPrompt(messages));

  // Ask Claude for a streaming chat completion given the prompt
  const bedrockResponse = await bedrockClient.send(
    new InvokeModelWithResponseStreamCommand({
      modelId: "anthropic.claude-v2",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: experimental_buildAnthropicPrompt(messages),
        max_tokens_to_sample: 2048,
      }),
    })
  );

  // Convert the response into a friendly text-stream
  const stream = AWSBedrockAnthropicStream(bedrockResponse);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
