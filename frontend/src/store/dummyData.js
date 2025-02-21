export const EXIST_MODEL = {
  chat_room_id: 1,
  model: "clova",
  response: {
    content: "100+1은 101입니다. 1은 그대로 1입니다.",
  },
}

export const NONEXIST_MODEL = {
  models: ["gemini", "clova", "chatgpt", "claude"],
  responses: {
    chatgpt: {
      content: "101입니다.",
    },
    claude: {
      content: "101입니다.",
    },
    clova: {
      content: "100+1 의 답은 101 입니다.",
    },
    gemini: {
      content: "100 + 1은 101입니다.",
    },
  },
  user_input: "100+1= 1은?",
}
