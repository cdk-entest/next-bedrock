import {
  BedrockRuntime,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { AWSBedrockAnthropicStream, StreamingTextResponse } from "ai";

const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { Client } = require("@opensearch-project/opensearch");
const { AwsSigv4Signer } = require("@opensearch-project/opensearch/aws");

// IMPORTANT! Set the runtime to edge
// export const runtime = "edge";

const decoder = new TextDecoder();

const bedrockClient = new BedrockRuntime({
  region: "us-east-1",
  // region: process.env.AWS_REGION ?? "us-east-1",
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  //   sessionToken: process.env.AWS_SESSION_TOKEN ?? "",
  // },
});

const aossClient = new Client({
  ...AwsSigv4Signer({
    region: "us-east-1",
    service: "aoss",
    getCredentials: () => {
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  node: "https://yvp6plo4ijurgy8ymhdg.us-east-1.aoss.amazonaws.com",
});

const createEmbedVector = async ({ doc }: { doc: string }) => {
  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "amazon.titan-embed-text-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: doc,
      }),
    })
  );

  const vec = JSON.parse(decoder.decode(response.body))["embedding"];
  console.log(vec.length);

  return vec;
};

const queryAoss = async ({ query }: { query: string }) => {
  console.log(query);

  const vec = await createEmbedVector({ doc: query });

  const body = {
    size: 2,
    query: {
      knn: {
        vector_field: {
          vector: vec,
          k: 2,
        },
      },
    },
  };

  var response = await aossClient.search({
    index: "demo",
    body: body,
  });

  for (let hit of response.body.hits.hits) {
    console.log(hit);
  }

  let result = "";

  for (let hit of response.body.hits.hits) {
    result += hit._source.text;
  }

  // console.log(result);

  return result;
};

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { messages } = await req.json();

  console.log(messages);

  // question last messages
  // const question = "what is developing on aws course?";

  const question = messages.pop().content;

  console.log(question);

  // query opensearch get context

  let context = "";

  try {
    context = await queryAoss({ query: question });
    console.log(context);
  } catch (error) {
    console.log(error);
  }

  const prompt = `\n\nHuman: Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. don't include harmful content \n\n ${context} \n\nHuman: ${question} \n\nAssistant:`;

  // Ask Claude for a streaming chat completion given the prompt
  const bedrockResponse = await bedrockClient.send(
    new InvokeModelWithResponseStreamCommand({
      modelId: "anthropic.claude-v2",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: prompt,
        max_tokens_to_sample: 2048,
      }),
    })
  );

  // Convert the response into a friendly text-stream
  const stream = AWSBedrockAnthropicStream(bedrockResponse);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
