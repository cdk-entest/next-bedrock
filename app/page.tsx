"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { SendIcon } from "@/components/icons";
import { Layout } from "./components/layout";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "./api/chat",
  });

  // Generate a map of message role to text color
  const roleToColorMap: Record<Message["role"], string> = {
    system: "red",
    user: "black",
    function: "blue",
    tool: "purple",
    assistant: "green",
    data: "orange",
  };

  const children = (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="fixed top-0 mt-8 w-full max-w-md px-5">
          <input
            className="w-full p-2 border border-gray-300 rounded shadow-xl"
            value={input}
            placeholder="Say something..."
            onChange={handleInputChange}
          />
          <button className="px-5 py-1 rounded-sm absolute top-[50%] right-2 translate-y-[-50%] opacity-80">
            <SendIcon className="w-5 h-5 text-green-500" />
          </button>
        </div>
      </form>

      {messages.length > 0
        ? messages.map((m) => (
            <div
              key={m.id}
              className="whitespace-pre-wrap px-5"
              style={{ color: roleToColorMap[m.role] }}
            >
              <strong>{`${m.role}: `}</strong>
              {m.content || JSON.stringify(m.function_call)}
              <br />
              <br />
            </div>
          ))
        : null}
    </div>
  );

  return <Layout>{children}</Layout>;
}
