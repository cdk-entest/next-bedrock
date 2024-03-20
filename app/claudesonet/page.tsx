"use client";

import { SendIcon } from "@/components/icons";
import { Layout } from "@/components/layout";

const ChatPage = () => {
  const callBedrock = async () => {
    const prompt = (document.getElementById("prompt") as HTMLInputElement)
      .value;
    const story = document.getElementById("story-output");
    story!.innerText = "";

    // console.log("call bedrock ", prompt);

    try {
      const response = await fetch("/api/claudesonet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      // console.log(response);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        try {
          const json = decoder.decode(value);
          story!.innerText += json;
          console.log(json);
        } catch (error) {
          console.log(error);
          // story!.innerText += "ERROR";
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const children = (
    <div>
      <form>
        <div className="fixed top-0 mt-8 w-full max-w-md px-5">
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded shadow-xl"
            id="prompt"
            placeholder="say something enter ..."
          ></input>
          <button
            className="px-5 py-1 rounded-sm absolute top-[50%] right-2 translate-y-[-50%] opacity-80"
            onClick={(event) => {
              event.preventDefault();
              callBedrock();
            }}
          >
            <SendIcon className="w-5 h-5 text-green-500" />
          </button>
        </div>
      </form>
      <p
        id="story-output"
        style={{ color: "green", marginBottom: "10px" }}
        className="px-5"
      ></p>
    </div>
  );

  return <Layout>{children}</Layout>;
};

export default ChatPage;
