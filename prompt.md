---
title: getting started with prompt and langchain in typescript
author: haimtran
date: 15/02/2024
---

## Basic Prompt

According to [bedroc docs](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-a-prompt.html)

> Prompts are a specific set of inputs provided by you, the user, that guide LLMs on Amazon Bedrock to generate an appropriate response or output for a given task or instruction.

- Proper format prompt for a model such as anthropic.claude-v2
- Add historical conversation or templates

Let create a simple example prompting an anthropic.calude-2

```ts
const messages = [
  { role: "user", content: "how to cook chicken soup?" },
  {
    role: "assistant",
    content:
      " Here is a basic recipe for homemade chicken soup:\n\nIngredients:\n- 1 whole chicken or 2-3 pounds chicken pieces (breasts, thighs, legs)\n- 2 tbsp olive oil\n- 1 onion, diced \n- 3 carrots, peeled and sliced\n- 3 stalks celery, sliced\n- 6 cups chicken broth\n- 2 bay leaves\n- 1 tsp thyme\n- Salt and pepper to taste\n- Egg noodles or rice (optional)\n\nInstructions:\n\n1. If using a whole chicken, remove skin and fat and cut the chicken into pieces. If using chicken pieces, trim off any excess fat or skin.\n\n2. Heat olive oil in a large pot over medium heat. Add the chicken pieces and cook for 3-4 minutes on each side until browned. Remove chicken to a plate. \n\n3. Add the onion, carrots and celery to the pot. Sauté for 5 minutes until vegetables are softened. \n\n4. Return the chicken to the pot and add the broth, bay leaves, thyme, salt and pepper. Bring to a boil, then reduce heat and simmer for 45 mins to 1 hour.\n\n5. Remove the chicken pieces and shred or cut into bite-sized pieces. Discard bay leaves.\n\n6. Add the shredded chicken back to the pot and add noodles or rice if desired. Cook for 8-10 minutes until noodles or rice are tender. \n\n7.",
  },
  {
    role: "user",
    content: "how to customize it for a little 3 years old girl?",
  },
  {
    role: "assistant",
    content:
      " Here are some tips for customizing homemade chicken soup for a 3 year old girl:\n\n- Use a mild tasting broth or reduce the amount of herbs/seasonings so it's not too strong flavored. You can use low sodium chicken broth.\n\n- Add small pasta shapes like stars, alphabets or mini noodles. Toddlers enjoy fun shaped pastas. \n\n- Dice the vegetables into small pieces so they are easy to eat. Good veggie additions include carrots, peas, corn, green beans.\n\n- Shred or cut the chicken into very small, bite-sized pieces. Remove any bones or skin to be safe. \n\n- Add a spoonful of uncooked rice to thicken the broth slightly. This makes it easy for a toddler to eat.\n\n- Stir in some spinach or kale at the end for extra nutrients. Blanch quickly in the hot soup to wilt.\n\n- Keep the soup on the milder side for spiciness. Avoid pepper or hot spices.\n\n- Mix in a dollop of plain yogurt or sour cream to provide thickness and tang.\n\n- Garnish with a sprinkle of shredded cheddar cheese for added flavor and nutrition. \n\n- Let the soup cool slightly before serving to prevent burns. Check temperature first.\n\n- Serve with soft bread sticks or rolls that are easy to dip and chew.\n\nThe key is tailoring the textures and flavors to a",
  },
  {
    role: "user",
    content: "should I add some spicy ingredients for the 3 years old one?  ",
  },
];

let buffer = "";

for (let i = 0; i < messages.length; i++) {
  if (messages[i]["role"] == "user") {
    buffer += "\n\nHuman:" + " " + messages[i]["content"];
  }

  if (messages[i]["role"] == "assistant") {
    buffer += "\n\nAssitant:" + messages[i]["content"];
  }
}

buffer += "\n\nAssistant:";

console.log(buffer);
```

Then send a request to bedrock

```ts
const callBedrock = async ({ prompt }: { prompt: string }) => {
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

  if (response.body) {
    const text = decoder.decode(response.body);

    console.log(text);
  }
};
```

## LangChain Prompt

Let use LangChain to create prompts from template or messages

```ts
const generatePrompt = async () => {
  const template = PromptTemplate.fromTemplate(`
Human: The following is a friendly conversation between a human and an AI.
The AI is talkative and provides lots of specific details from its context. If the AI does not know
the answer to a question, it truthfully says it does not know.

Current conversation:
<conversation_history>
{history}
</conversation_history>

Here is the human's next reply:
<human_reply>
{input}
</human_reply>

Assistant:
  `);

  const prompt = await template.format({
    history: "",
    input: "How to cook chicken soup?",
  });

  console.log(prompt);

  return prompt;
};
```

Another way to call prompt is using messages

```ts
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a world class technical documentation writer."],
  ["user", "{input}"],
]);

console.log(await prompt.format({ input: "How to cook chicken soup?" }));
```

Then prompt the model

```ts
const prompt = await generatePrompt();

await callBedrock({ prompt: prompt });
```

## LangChain Chain

Let create a simple chain [here](https://python.langchain.com/docs/expression_language/get_started#basic-example-prompt-model-output-parser)

> The most basic and common use case is chaining a prompt template and a model together

```ts
const testChain = async () => {
  const parser = new StringOutputParser();

  const prompt = PromptTemplate.fromTemplate(`
Human: The following is a friendly conversation between a human and an AI.
The AI is talkative and provides lots of specific details from its context. If the AI does not know
the answer to a question, it truthfully says it does not know.

Current conversation:
<conversation_history>
{history}
</conversation_history>

Here is the human's next reply:
<human_reply>
{input}
</human_reply>

Assistant:
  `);

  const previousMessages = [
    { role: "user", content: "how to cook chicken soup?" },
    {
      role: "assistant",
      content:
        " Here is a basic recipe for homemade chicken soup:\n\nIngredients:\n- 1 whole chicken or 2-3 pounds chicken pieces (breasts, thighs, legs)\n- 2 tbsp olive oil\n- 1 onion, diced \n- 3 carrots, peeled and sliced\n- 3 stalks celery, sliced\n- 6 cups chicken broth\n- 2 bay leaves\n- 1 tsp thyme\n- Salt and pepper to taste\n- Egg noodles or rice (optional)\n\nInstructions:\n\n1. If using a whole chicken, remove skin and fat and cut the chicken into pieces. If using chicken pieces, trim off any excess fat or skin.\n\n2. Heat olive oil in a large pot over medium heat. Add the chicken pieces and cook for 3-4 minutes on each side until browned. Remove chicken to a plate. \n\n3. Add the onion, carrots and celery to the pot. Sauté for 5 minutes until vegetables are softened. \n\n4. Return the chicken to the pot and add the broth, bay leaves, thyme, salt and pepper. Bring to a boil, then reduce heat and simmer for 45 mins to 1 hour.\n\n5. Remove the chicken pieces and shred or cut into bite-sized pieces. Discard bay leaves.\n\n6. Add the shredded chicken back to the pot and add noodles or rice if desired. Cook for 8-10 minutes until noodles or rice are tender. \n\n7.",
    },
  ];

  // console.log(formatMessages(previousMessages));

  const promptValue = await prompt.invoke({
    history: formatMessages(previousMessages),
    input: "How to customize it for a little 3 years old girl?",
  });

  console.log(promptValue.toString());

  const chain = prompt.pipe(model);

  const stream = await chain.stream({
    history: formatMessages(previousMessages),
    input: "How to customize it for a little 3 years old girl?",
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }

  const response = await chain.invoke({
    history: formatMessages(previousMessages),
    input: "how to customize it for a little 3 years old girl?",
  });

  console.log(response);
};
```

## LangChain Memory

> Most LLM applications have a conversational interface. An essential component of a conversation is being able to refer to information introduced earlier in the conversation. At bare minimum, a conversational system should be able to access some window of past messages directly. A more complex system will need to have a world model that it is constantly updating, which allows it to do things like maintain information about entities and their relationships.

- Customize memory [AI Prefix](https://python.langchain.com/docs/modules/memory/conversational_customization)

- [Memory key](https://python.langchain.com/docs/modules/memory/#what-keys-are-saved-to-memory)

```ts
const testLLMChain = async () => {
  const prompt = PromptTemplate.fromTemplate(`
Human: The following is a friendly conversation between a human and an AI.
The AI is talkative and provides lots of specific details from its context. If the AI does not know
the answer to a question, it truthfully says it does not know.

Current conversation:
<conversation_history>
{history}
</conversation_history>

Here is the human's next reply:
<human_reply>
{question}
</human_reply>

Assistant:
  `);

  const memory = new BufferMemory({
    memoryKey: "history",
    returnMessages: true,
    inputKey: "question",
    aiPrefix: "AI Assistant",
  });

  const llm = new Bedrock({
    model: "anthropic.claude-v2",
    region: "us-east-1",
    maxTokens: 2048,
    temperature: 0.8,
  });

  const conversation = new LLMChain({
    llm: llm,
    prompt: prompt,
    verbose: true,
    memory: memory,
  });

  const response = await conversation.invoke({
    question: "How to cook chicken soup?",
  });

  console.log(response);

  // const response1 = await conversation.invoke({
  //   question: "How to customize it for a 3 years old little girl?",
  // });

  // console.log(response1);

  console.log(await conversation.memory?.loadMemoryVariables({}));
};
```

## LangChain Integration

There are multiple ways to call bedrock

- AWS Bedorck SDK (Bedrock runtime)
- LangChain Bedorck LLM [HERE](https://js.langchain.com/docs/integrations/llms/bedrock)
- LangChain Bedorck Chat Model [HERE](https://js.langchain.com/docs/integrations/chat/bedrock)

Let call Bedorck using aws sdk Bedrock runtime

```ts
const bedrockClient = new BedrockRuntimeClient({
  region: "us-east-1",
});

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
```

Let call Bedrock using LangChain LLM Bedrock model

```ts
const model = new Bedrock({
  model: "anthropic.claude-v2",
  region: "us-east-1",
  maxTokens: 2048,
  temperature: 0.8,
});

const prompt = await generatePrompt();

const response = await model.invoke(prompt, {});
```

Let call Bedrock using LangChain Bedrock Chat Model

```ts
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
// Or, from web environments:
// import { BedrockChat } from "@langchain/community/chat_models/bedrock/web";
import { HumanMessage } from "@langchain/core/messages";

// If no credentials are provided, the default credentials from
// @aws-sdk/credential-provider-node will be used.
const model = new BedrockChat({
  model: "anthropic.claude-v2",
  region: "us-east-1",
  // endpointUrl: "custom.amazonaws.com",
  // credentials: {
  //   accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID!,
  //   secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY!,
  // },
  // modelKwargs: {},
});

const res = await model.invoke([
  new HumanMessage({ content: "Tell me a joke" }),
]);
console.log(res);

/*
  AIMessage {
    content: " Here's a silly joke: \n" +
      '\n' +
      'What do you call a dog magician? A labracadabrador!',
    name: undefined,
    additional_kwargs: {}
  }
*/
```

## Code

Here is the sample code

<details>S
<summary>sample.ts</summary>

```ts
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { Bedrock } from "@langchain/community/llms/bedrock";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { LLMChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

const messages = [
  { role: "user", content: "how to cook chicken soup?" },
  {
    role: "assistant",
    content:
      " Here is a basic recipe for homemade chicken soup:\n\nIngredients:\n- 1 whole chicken or 2-3 pounds chicken pieces (breasts, thighs, legs)\n- 2 tbsp olive oil\n- 1 onion, diced \n- 3 carrots, peeled and sliced\n- 3 stalks celery, sliced\n- 6 cups chicken broth\n- 2 bay leaves\n- 1 tsp thyme\n- Salt and pepper to taste\n- Egg noodles or rice (optional)\n\nInstructions:\n\n1. If using a whole chicken, remove skin and fat and cut the chicken into pieces. If using chicken pieces, trim off any excess fat or skin.\n\n2. Heat olive oil in a large pot over medium heat. Add the chicken pieces and cook for 3-4 minutes on each side until browned. Remove chicken to a plate. \n\n3. Add the onion, carrots and celery to the pot. Sauté for 5 minutes until vegetables are softened. \n\n4. Return the chicken to the pot and add the broth, bay leaves, thyme, salt and pepper. Bring to a boil, then reduce heat and simmer for 45 mins to 1 hour.\n\n5. Remove the chicken pieces and shred or cut into bite-sized pieces. Discard bay leaves.\n\n6. Add the shredded chicken back to the pot and add noodles or rice if desired. Cook for 8-10 minutes until noodles or rice are tender. \n\n7.",
  },
  {
    role: "user",
    content: "how to customize it for a little 3 years old girl?",
  },
  {
    role: "assistant",
    content:
      " Here are some tips for customizing homemade chicken soup for a 3 year old girl:\n\n- Use a mild tasting broth or reduce the amount of herbs/seasonings so it's not too strong flavored. You can use low sodium chicken broth.\n\n- Add small pasta shapes like stars, alphabets or mini noodles. Toddlers enjoy fun shaped pastas. \n\n- Dice the vegetables into small pieces so they are easy to eat. Good veggie additions include carrots, peas, corn, green beans.\n\n- Shred or cut the chicken into very small, bite-sized pieces. Remove any bones or skin to be safe. \n\n- Add a spoonful of uncooked rice to thicken the broth slightly. This makes it easy for a toddler to eat.\n\n- Stir in some spinach or kale at the end for extra nutrients. Blanch quickly in the hot soup to wilt.\n\n- Keep the soup on the milder side for spiciness. Avoid pepper or hot spices.\n\n- Mix in a dollop of plain yogurt or sour cream to provide thickness and tang.\n\n- Garnish with a sprinkle of shredded cheddar cheese for added flavor and nutrition. \n\n- Let the soup cool slightly before serving to prevent burns. Check temperature first.\n\n- Serve with soft bread sticks or rolls that are easy to dip and chew.\n\nThe key is tailoring the textures and flavors to a",
  },
  {
    role: "user",
    content: "should I add some spicy ingredients for the 3 years old one?  ",
  },
];

const decoder = new TextDecoder();

const bedrockClient = new BedrockRuntimeClient({
  region: "us-east-1",
});

const model = new Bedrock({
  model: "anthropic.claude-v2",
  region: "us-east-1",
  maxTokens: 2048,
  temperature: 0.8,
});

const formatMessages = (messages: any) => {
  let buffer = "";

  for (let i = 0; i < messages.length; i++) {
    if (messages[i]["role"] == "user") {
      buffer += "\n\nHuman:" + " " + messages[i]["content"];
    }

    if (messages[i]["role"] == "assistant") {
      buffer += "\n\nAssitant:" + messages[i]["content"];
    }
  }

  return buffer;
};

const callBedrock = async ({ prompt }: { prompt: string }) => {
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

  if (response.body) {
    const text = decoder.decode(response.body);

    console.log(text);
  }

  // console.log(response);
};

const testPrompt = async () => {
  const template = PromptTemplate.fromTemplate(`
Human: The following is a friendly conversation between a human and an AI.
The AI is talkative and provides lots of specific details from its context. If the AI does not know
the answer to a question, it truthfully says it does not know.

Current conversation:
<conversation_history>
{history}
</conversation_history>

Here is the human's next reply:
<human_reply>
{input}
</human_reply>

Assistant:
  `);

  const prompt = await template.format({
    history: "",
    input: "How to cook chicken soup?",
  });

  console.log(prompt);

  return prompt;
};

const testBedrockModel = async ({ prompt }: { prompt: string }) => {
  const response = await model.invoke(prompt, {});

  console.log(response);
};

const testChain = async () => {
  const parser = new StringOutputParser();

  const prompt = PromptTemplate.fromTemplate(`
Human: The following is a friendly conversation between a human and an AI.
The AI is talkative and provides lots of specific details from its context. If the AI does not know
the answer to a question, it truthfully says it does not know.

Current conversation:
<conversation_history>
{history}
</conversation_history>

Here is the human's next reply:
<human_reply>
{input}
</human_reply>

Assistant:
  `);

  const previousMessages = [
    { role: "user", content: "how to cook chicken soup?" },
    {
      role: "assistant",
      content:
        " Here is a basic recipe for homemade chicken soup:\n\nIngredients:\n- 1 whole chicken or 2-3 pounds chicken pieces (breasts, thighs, legs)\n- 2 tbsp olive oil\n- 1 onion, diced \n- 3 carrots, peeled and sliced\n- 3 stalks celery, sliced\n- 6 cups chicken broth\n- 2 bay leaves\n- 1 tsp thyme\n- Salt and pepper to taste\n- Egg noodles or rice (optional)\n\nInstructions:\n\n1. If using a whole chicken, remove skin and fat and cut the chicken into pieces. If using chicken pieces, trim off any excess fat or skin.\n\n2. Heat olive oil in a large pot over medium heat. Add the chicken pieces and cook for 3-4 minutes on each side until browned. Remove chicken to a plate. \n\n3. Add the onion, carrots and celery to the pot. Sauté for 5 minutes until vegetables are softened. \n\n4. Return the chicken to the pot and add the broth, bay leaves, thyme, salt and pepper. Bring to a boil, then reduce heat and simmer for 45 mins to 1 hour.\n\n5. Remove the chicken pieces and shred or cut into bite-sized pieces. Discard bay leaves.\n\n6. Add the shredded chicken back to the pot and add noodles or rice if desired. Cook for 8-10 minutes until noodles or rice are tender. \n\n7.",
    },
  ];

  // console.log(formatMessages(previousMessages));

  const promptValue = await prompt.invoke({
    history: formatMessages(previousMessages),
    input: "How to customize it for a little 3 years old girl?",
  });

  console.log(promptValue.toString());

  // const chain = prompt.pipe(model);

  // const stream = await chain.stream({
  //   history: formatMessages(previousMessages),
  //   input: "How to customize it for a little 3 years old girl?",
  // });

  // for await (const chunk of stream) {
  //   process.stdout.write(chunk);
  // }

  // const response = await chain.invoke({
  //   history: formatMessages(previousMessages),
  //   input: "how to customize it for a little 3 years old girl?",
  // });

  // console.log(response);
};

const testPromptMessages = async () => {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a world class technical documentation writer."],
    ["user", "{input}"],
  ]);

  console.log(await prompt.format({ input: "How to cook chicken soup?" }));
};

const testLLMChain = async () => {
  const prompt = PromptTemplate.fromTemplate(`
Human: The following is a friendly conversation between a human and an AI.
The AI is talkative and provides lots of specific details from its context. If the AI does not know
the answer to a question, it truthfully says it does not know.

Current conversation:
<conversation_history>
{history}
</conversation_history>

Here is the human's next reply:
<human_reply>
{question}
</human_reply>

Assistant:
  `);

  const memory = new BufferMemory({
    memoryKey: "history",
    returnMessages: true,
    inputKey: "question",
    aiPrefix: "AI Assistant",
  });

  const llm = new Bedrock({
    model: "anthropic.claude-v2",
    region: "us-east-1",
    maxTokens: 2048,
    temperature: 0.8,
  });

  const conversation = new LLMChain({
    llm: llm,
    prompt: prompt,
    verbose: true,
    memory: memory,
  });

  const response = await conversation.invoke({
    question: "How to cook chicken soup?",
  });

  // console.log(response);

  // const response1 = await conversation.invoke({
  //   question: "How to customize it for a 3 years old little girl?",
  // });

  // console.log(response1);

  console.log(await conversation.memory?.loadMemoryVariables({}));
};

const main = async () => {
  // const prompt = await testPrompt();

  // await callBedrock({ prompt: prompt });

  // await testBedrockModel({ prompt: prompt });

  // await testChain();

  // await testPromptMessages();

  await testLLMChain();
};

main();
```

</details>

And package.json

```json
{
  "name": "next-prisma-hello",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.490.0",
    "@aws-sdk/client-s3": "^3.504.0",
    "@aws-sdk/s3-request-presigner": "^3.504.0",
    "@langchain/community": "^0.0.28",
    "@langchain/core": "^0.1.28",
    "@prisma/client": "^5.8.0",
    "ai": "^2.2.33",
    "langchain": "^0.1.18",
    "next": "14.0.4",
    "package.json": "^2.0.1",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.4",
    "postcss": "^8",
    "prisma": "^5.8.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
```

## Reference

- [LangChain Simple Chain](https://python.langchain.com/docs/expression_language/get_started#basic-example-prompt-model-output-parser)

- [LangChain Memory Conversation](https://python.langchain.com/docs/modules/memory/#end-to-end-example)

- [LangChain Bedrock](https://python.langchain.com/docs/integrations/llms/bedrock)
