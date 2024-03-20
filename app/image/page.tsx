"use client";

import { useEffect, useState } from "react";
import { genImage } from "./actions";

const SendIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      strokeWidth="2"
    >
      <path
        d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"
        fill="currentColor"
      ></path>
    </svg>
  );
};

const HomePage = () => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {}, [url]);

  return (
    <main>
      <div className="max-w-3xl mx-auto">
        <div className="fixed bottom-5 max-w-md px-5">
          <button
            className="bg-orange-500 px-5 py-3 rounded-sm"
            onClick={(event) => {
              document
                .getElementById("modal-select")
                ?.classList.toggle("hidden");
            }}
          >
            Select Model
          </button>
        </div>
        <div
          className="fixed top-0 left-0 w-full min-h-screen bg-gray-800 opacity-100 z-10 hidden"
          id="modal-select"
        >
          <div className="flex flex-col justify-center items-center min-h-screen">
            <div className="grid grid-cols-1 gap-3 w-[300px] p-10">
              <a href="/claudesonet">
                <button className="bg-orange-500 px-5 py-3 rounded shadow-lg hover:bg-green-500 w-full">
                  ClaudeSonet
                </button>
              </a>
              <a href="/claudehaiku">
                <button className="bg-orange-500 px-5 py-3 rounded shadow-lg w-full hover:bg-green-500">
                  ClaudeHaiku
                </button>
              </a>
              <a href="/aoss">
                <button className="bg-orange-500 px-5 py-3 rounded shadow-lg w-full hover:bg-green-500">
                  OpenSearch
                </button>
              </a>
              <a href="/upload">
                <button className="bg-orange-500 px-5 py-3 rounded shadow-lg w-full hover:bg-green-500">
                  Upload Document
                </button>
              </a>
              <a href="/rag">
                <button className="bg-orange-500 px-5 py-3 rounded shadow-lg w-full hover:bg-green-500">
                  RAG
                </button>
              </a>
              <a href="/image">
                <button className="bg-orange-500 px-5 py-3 rounded shadow-lg w-full hover:bg-green-500">
                  StableDiffusion
                </button>
              </a>
              <button
                className="bg-orange-500 px-5 py-3 rounded shadow-lg w-full hover:bg-green-500"
                onClick={(event) => {
                  document
                    .getElementById("modal-select")
                    ?.classList.toggle("hidden");
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
        <form className="mt-10 px-5">
          <div className="relative">
            <textarea
              rows={2}
              id="prompt"
              name="prompt"
              className="w-[100%] bg-gray-300 px-5 py-5 rounded-sm"
              onKeyDown={async (event) => {
                if (event.key === "Enter" && event.shiftKey === false) {
                  event.preventDefault();
                  setUrl("");
                  document.getElementById("modal")!.style.display = "block";
                  const url = await genImage({
                    prompt: (
                      document.getElementById("prompt") as HTMLInputElement
                    ).value,
                  });
                  setUrl(url);
                  document.getElementById("modal")!.style.display = "none";
                }
              }}
            ></textarea>

            <button
              className="absolute top-[50%] translate-y-[-50%] right-1 flex items-center justify-center rounded-md w-10 h-16 bg-green-500 hover:bg-green-600"
              onClick={async (event) => {
                event.preventDefault();
                setUrl("");
                document.getElementById("modal")!.style.display = "block";
                const url = await genImage({
                  prompt: (
                    document.getElementById("prompt") as HTMLInputElement
                  ).value,
                });
                setUrl(url);
                document.getElementById("modal")!.style.display = "none";
              }}
            >
              <SendIcon className="h-4 w-4 text-white"></SendIcon>
            </button>
          </div>
        </form>
        <div className="mt-10 px-10">
          <img src={url}></img>
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
    </main>
  );
};

export default HomePage;
