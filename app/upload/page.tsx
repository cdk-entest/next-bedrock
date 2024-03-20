"use client";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const uploadToS3 = async (file: File) => {
  console.log("upload to s3 ");

  // s3 client
  const s3Client = new S3Client({
    region: "us-east-1",
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: "us-east-1" },
      identityPoolId: "us-east-1:887c4756-e061-4fb0-a44a-cc9a6a59d96d",
      logins: {
        // [process.env.COGNITO_POOL_ID ?? ""]: idToken,
      },
    }),
  });

  // command to upload to s3
  const command = new PutObjectCommand({
    Bucket: "cdk-entest-videos",
    Key: `documents/${file.name}`,
    Body: file,
  });

  // upload file to s3
  try {
    document.getElementById("modal")!.style.display = "block";
    const res = await s3Client.send(command);
    console.log(res);
  } catch (error) {
    console.log("erorr upload to s3 ", error);
  }
  document.getElementById("modal")!.style.display = "none";
};

const IndexPage = () => {
  const submit = async (data: FormData) => {
    const file = data.get("upload") as File;
    await uploadToS3(file);
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div>
        <form className="mb-5" action={submit}>
          <div className="flex flex-row w-full bg-gray-200 justify-center items-center py-3 px-3">
            <input
              type="file"
              id="upload"
              name="upload"
              className="w-full cursor-pointer"
            ></input>
            <button
              id="upload-button"
              className="bg-orange-400 px-10 py-3 rounded-sm"
              onClick={(event) => {
                console.log("upload file ...");
              }}
            >
              Upload
            </button>
          </div>
        </form>
        <div>
          <p id="result"></p>
        </div>
      </div>
      <div
        id="modal"
        className="fixed top-0 left-0 bg-slate-400 min-h-screen w-full opacity-60"
        hidden
      >
        <div className="min-h-screen flex justify-center items-center">
          <h1>Wait a few second!</h1>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
