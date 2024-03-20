"use client";

import { useState } from "react";
import { indexAoss, queryAoss } from "./action";

const IndexPage = () => {
  const [docs, setDocs] = useState<any[]>([]);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div>
        <form
          className="mb-3"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input
            type="text"
            id="title"
            name="title"
            placeholder="title"
            className="w-full bg-gray-200 p-5 mb-3"
          ></input>
          <textarea
            className="bg-gray-200 w-full p-5"
            rows={15}
            placeholder="document ..."
            id="document"
            name="document"
          ></textarea>
          <button
            className="px-10 py-3 rounded-sm bg-orange-400"
            onClick={async (event) => {
              event.preventDefault();

              const title = (
                document.getElementById("title") as HTMLInputElement
              ).value;

              const doc = (
                document.getElementById("document") as HTMLInputElement
              ).value;

              console.log(title, doc);

              document.getElementById("modal")!.style.display = "block";
              await indexAoss({ doc: doc, title: title });
              document.getElementById("modal")!.style.display = "none";
            }}
          >
            Index
          </button>
        </form>
        <div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              className="w-full px-5 py-3 bg-gray-200"
              placeholder="query ..."
              type="text"
              id="query"
              name="query"
            ></input>
            <button
              className="px-10 py-3 rounded-sm bg-orange-400 mt-2"
              onClick={async (event) => {
                event.preventDefault();
                const query = (
                  document.getElementById("query") as HTMLInputElement
                ).value;

                console.log(query);
                const docs = await queryAoss({ query: query });
                setDocs(docs);

                console.log(docs);
                // document.getElementById("result")!.innerText = docs;
              }}
            >
              Query
            </button>
          </form>
        </div>
        <div>
          {docs.map((doc) => (
            <div key={doc._id} className="mb-3">
              <h3 className="font-bold">{doc._source.title}</h3>
              <p>{doc._source.text}</p>
              <hr className="bg-blue-500 border-1 border-blue-500"></hr>
            </div>
          ))}
        </div>
      </div>
      <div
        id="modal"
        className="fixed top-0 left-0 bg-slate-400 min-h-screen w-full opacity-90"
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
