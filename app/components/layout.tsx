"use client";

export const Layout = ({ children }: { children: any }) => {
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="fixed bottom-5 max-w-md px-5">
        <button
          className="bg-orange-500 px-5 py-3 rounded-sm"
          onClick={(event) => {
            document.getElementById("modal-select")?.classList.toggle("hidden");
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
      {children}
    </div>
  );
};
