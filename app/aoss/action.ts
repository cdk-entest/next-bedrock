"use server";

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { Client } = require("@opensearch-project/opensearch");
const { AwsSigv4Signer } = require("@opensearch-project/opensearch/aws");

import { writeFile } from "fs/promises";
import { join } from "path";

const decoder = new TextDecoder();

const bedrockClient = new BedrockRuntimeClient({
  region: "us-east-1",
});

const s3Client = new S3Client({
  region: "us-east-1",
  // credentials: fromCognitoIdentityPool({
  //   clientConfig: { region: config.REGION },
  //   identityPoolId: config.IDENTITY_POOL_ID,
  //   logins: {
  //     [config.COGNITO_POOL_ID]: idToken,
  //   },
  // }),
});

const aossClient = new Client({
  ...AwsSigv4Signer({
    region: "us-east-1",
    service: "aoss",
    getCredentials: () => {
      const credentialsProvider = defaultProvider({});
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

  return vec;
};

export const queryAoss = async ({ query }: { query: string }) => {
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

  // let result = "";

  // for (let hit of response.body.hits.hits) {
  //   result += hit._source.text;
  // }

  // console.log(result);

  // return result;

  const docs = response.body.hits.hits;

  console.log(docs);

  return docs;
};

export const indexAoss = async ({
  doc,
  title,
}: {
  doc: string;
  title: string;
}) => {
  // no chunk split
  const vec = await createEmbedVector({ doc: doc });

  // serverless does not support id
  const body = {
    vector_field: vec,
    text: doc,
    title: title,
  };

  var response = await aossClient.index({
    index: "demo",
    body: body,
  });

  console.log(response);
};

const qaRag = async ({ question }: { question: string }) => {
  // query opensearch get context
  const context = await queryAoss({ query: question });

  // build prompt

  const prompt = `\n\nHuman: Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. don't include harmful content \n\n ${context} \n\nHuman: ${question} \n\nAssistant:`;

  console.log(prompt);

  // prompt bedrock anthropic
  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "anthropic.claude-v2",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: prompt,
        max_tokens_to_sample: 2048,
      }),
    })
  );

  console.log(response);

  console.log(decoder.decode(response.body));
};

export const uploadFile = async (data: FormData) => {
  console.log("file: ", data.get("upload"));

  const file: File | null = data.get("upload") as unknown as File;

  if (!file) {
    throw new Error("No file uploaded");
  }

  // file buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // write to local
  const path = join("/tmp", file.name);
  await writeFile(path, buffer);
  console.log(`open ${path} to see the upload file`);

  // write to s3

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET,
    Key: `documents/${file.name}`,
    Body: Buffer.from(bytes),
  });

  // upload file to s3
  try {
    const res = await s3Client.send(command);
    console.log(res);
  } catch (error) {
    console.log("erorr upload to s3 ", error);
  }

  return {
    status: "OK",
    message: "message sent OK",
  };
};

// createEmbedVector({ doc: "hello" });
// queryAoss({ query: "What is Amazon Bedrock" });
// indexAoss({
//   doc: "Amazon Bedrock is a fully managed service that makes high-performing foundation models (FMs) from leading AI startups and Amazon available for your use through a unified API. You can choose from a wide range of foundation models to find the model that is best suited for your use case. Amazon Bedrock also offers a broad set of capabilities to build generative AI applications with security, privacy, and responsible AI. Using Amazon Bedrock, you can easily experiment with and evaluate top foundation models for your use cases, privately customize them with your data using techniques such as fine-tuning and Retrieval Augmented Generation (RAG), and build agents that execute tasks using your enterprise systems and data sources. With Amazon Bedrock's serverless experience, you can get started quickly, privately customize foundation models with your own data, and easily and securely integrate and deploy them into your applications using AWS tools without having to manage any infrastructure.",
//   title: "What is Amazon Bedrock",
// });

// qaRag({ question: "what is developing on aws course?" });
