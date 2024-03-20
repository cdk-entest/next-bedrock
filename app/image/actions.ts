"use server";

import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  BedrockRuntime,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import * as fs from "fs";

const bedrock = new BedrockRuntime({ region: "us-east-1" });

const s3Client = new S3Client({ region: "us-east-1" });

const genImage = async ({ prompt }: { prompt: string }) => {
  let url = "";

  const body = {
    text_prompts: [{ text: prompt, weight: 1 }],
    seed: 3,
    cfg_scale: 10,
    samples: 1,
    steps: 50,
    style_preset: "anime",
    height: 1024,
    width: 1024,
  };

  const command = new InvokeModelCommand({
    body: JSON.stringify(body),
    modelId: "stability.stable-diffusion-xl-v1",
    contentType: "application/json",
    accept: "image/png",
  });

  try {
    console.log(prompt);
    const imageName = "sample" + Date.now().toString() + ".png";
    const key = `next-vercel-ai/${imageName}`;
    const response = await bedrock.send(command);

    // fs.writeFile(`./public/${imageName}`, response["body"], () => {
    //   console.log("OK");
    // });

    // upload to s3 input location
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
        Body: response["body"],
      })
    );

    // generate signed url
    const commandGetUrl = new GetObjectCommand({
      Bucket: process.env.BUCKET,
      Key: key,
    });

    url = await getSignedUrl(s3Client as any, commandGetUrl as any, {
      expiresIn: 3600,
    });

    console.log(url);
  } catch (error) {
    console.log(error);
  }

  return url;
};

export { genImage };
