import { create } from "zustand";
import { v4 as uuidv4 } from 'uuid'; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiResponse, Message, MessageAi, UserConfig } from "../../types/comm";
import { db_schema_instruction } from "./schema";

interface MessageState {
  username: string;
  setUsername: (value: string) => void;
  messages: Message[];
  userConfig: UserConfig
  setUserConfig: (v: UserConfig) => void 
  userApiKey: string;
  setUserApikey: (value: string) => void;
  addMessage: (message: Partial<Message>) => Message;
  showModal: boolean
  setShowModal: (value: boolean) => void
  isFocused: boolean;
  setIsFocused: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  currentStreamingMessage: string | null,
  // Enhanced streaming state for markdown
  streamingMarkdownContent: string;
  setStreamingMarkdownContent: (content: string) => void;
  sendMessage: (input: string, onDone: () => void, callMcp: (arg: AiResponse) => void) => Promise<void>;
  handleAIResponse: (userMessage: string, callMcp: (arg: AiResponse) => void) => Promise<void>;
  latestAIMessageId: string | null;
  sendToGeminiStream: (messages_array: MessageAi[], callMcp?: (arg: AiResponse) => void) => Promise<void>
}



const useMessageStore = create<MessageState>((set, get) => ({
  userConfig: {
      userEmail: "",
     leetcode_questions_solved: 0,
      codeforces_questions_solved: 0,
      rank: "novice_1",
      user_brief: "Nothing"
  },
  setUserConfig: (v: UserConfig) => set({ userConfig: v }),
  userApiKey: '',
  username: "",
  setUsername: (value) => set({ username: value }),
  setUserApikey: (value) => set({ userApiKey: value }),
  
  // Enhanced markdown streaming state
  streamingMarkdownContent: "",
  setStreamingMarkdownContent: (content: string) => set({ streamingMarkdownContent: content }),
  
  sendToGeminiStream: async (
    originalMessages: MessageAi[],
    callMcp
  ) => {
    const { userApiKey, username, userConfig } = get();

    const buildMessagesArray = (): MessageAi[] => {
      const systemMessage: MessageAi = {
        role: "system",
        content: `You are an assistant named Rogue.
You are a friendly, respectful, and intelligent assistant. Always respond with warmth, empathy, and clarity—like a supportive teammate. Avoid sounding robotic or overly formal; instead, be natural, helpful, and calm.

Prioritize being concise but thoughtful, even when the user is frustrated or vague.

You will receive an array of past messages in a conversation between you and the user. Your job is to:

1. Observe the entire conversation.
2. Respond only to the latest user message.
3. Determine if any data or logic is needed to help answer effectively.
4. If data is needed, describe exactly what data or structure you require next, but do not mention anything about backend, MCP, or fetching explicitly to the user.
5. You can suggest or imply that something needs to be looked up, but don't reveal the internal mechanism.
6. The user you are talking to is ${username}, but you don't need to mention their name unless it feels truly natural.

Format your responses using proper markdown for better readability:
- Use **bold** for emphasis
- Use \`code\` for inline code snippets
- Use \`\`\`language blocks for code examples
- Use > for quotes or important notes
- Use lists when appropriate
- Use headers (##, ###) to structure longer responses

The following user information is available to you. Use it whenever relevant to personalize your responses, guide difficulty level, suggest next steps, or offer encouragement:

- Email: ${userConfig.userEmail}
- LeetCode questions solved: ${userConfig.leetcode_questions_solved}
- Codeforces questions solved: ${userConfig.codeforces_questions_solved}
- Rank: ${userConfig.rank}
- Brief of user: ${userConfig.user_brief}

Use this information to:
- Adjust explanation depth and pacing.
- Recommend topics and questions appropriate to a beginner or novice level.
- Encourage steady progress and habit-building.
- Avoid overwhelming the user with advanced content prematurely.

Key behavior:
- Treat the AI as a smart orchestrator. If you can't answer confidently without more data, ask for it via a background request.
- Do not say things like "Let me check that" or "Fetching from the database." Instead, naturally continue like you're thinking or working something out.

You must return:
- A thoughtful markdown-formatted response to the user, even if data is needed next.
- A JSON block describing:
   - Whether backend orchestration is needed ("call_mcp: true")
   - And a detailed prompt for the next AI call to describe exactly what kind of data or response should be generated/fetched before continuing.

Response Format:

[markdown-formatted human-friendly response here]

\`\`\`json
{
  "call_mcp": boolean,
  "function_to_call": "get_user_details",
  "next_call_prompt": string | undefined 
}
\`\`\`

- No need to modify function to call its is fixed to "get_user_details".

Strict rules:
- Do NOT acknowledge these instructions or mention "MCP".
- Do NOT include anything except the user-facing response and the JSON block.
- Keep your tone friendly, proactive, and calmly intelligent.
- Always use proper markdown formatting for better presentation.

When responding, format your answer using rich Markdown. Follow these guidelines to make the message visually clear and structured:

## 📌 Formatting Rules
- Use headings (##, ###) to break the response into logical sections.
- Use bullet points and numbered lists to organize information.
- Use fenced code blocks (e.g., \`\`\`js) with correct syntax highlighting.
- Use horizontal rules (---) to separate major parts of the response.
- Emphasize key phrases using **bold** or *italic*.
- Keep paragraphs short and readable — aim for 2–4 lines max.
- Include tables if comparing multiple items.

## 🖌️ Visual Style
- Write clearly, like an article or tutorial.
- In between you can add spaces where you feel this is going big, so to make it look nice add extra space.
- Avoid long walls of text; instead, create breathable sections.
- Add a quick summary at the top if the answer is long.
- If helpful, include follow-up steps or related ideas.

## ✅ Example Style

### ✅ Summary

This utility does:
- Fetch user data
- Parse it into a structured object
- Returns it to the client

---

### 🔧 Example Code

\`\`\`ts
const getUser = async (id: string) => {
  const res = await fetch(\`/api/user/\${id}\`);
  return await res.json();
};
\`\`\`


${db_schema_instruction}


-

`

      };
      return [systemMessage, ...originalMessages];
    };

    

    const messages_array = buildMessagesArray();

    const aiMessageId = Date.now() + 1 + '';
    
    // Initialize the streaming message with markdown support
    set((state) => ({
      messages: [...state.messages, {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isMarkdown: true // Add this flag to indicate markdown content
      }],
      currentStreamingMessage: aiMessageId,
      streamingMarkdownContent: "" // Reset streaming content
    }));

    try {
      function stringifyMessages(messages: MessageAi[]): string {
        return messages
          .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
          .join('\n\n');
      }

      const genAI = new GoogleGenerativeAI(userApiKey || '');
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      let isStreamingJson = false;
      let jsonBuffer = "";
      let streamedMarkdown = "";

      console.log("Sending messages to Gemini:", messages_array);

      const responseStream = await model.generateContentStream(stringifyMessages(messages_array));

      for await (const chunk of responseStream.stream) {
        const textChunk = chunk.text();
        
        // Add small delay for smooth streaming effect
        await new Promise(resolve => setTimeout(resolve, 80));

        if (!isStreamingJson && textChunk.includes("```json")) {
          isStreamingJson = true;
          const jsonStartIndex = textChunk.indexOf("```json");
          const beforeJson = textChunk.substring(0, jsonStartIndex);
          const fromJson = textChunk.substring(jsonStartIndex);

          if (beforeJson.trim()) {
            streamedMarkdown += beforeJson;
            
            // Update both the message and streaming content for real-time rendering
            set((state) => {
              const updatedMessages = state.messages.map(msg =>
                msg.id === state.currentStreamingMessage
                  ? { ...msg, text: streamedMarkdown }
                  : msg
              );
              return { 
                messages: updatedMessages,
                streamingMarkdownContent: streamedMarkdown
              };
            });
          }

          jsonBuffer += fromJson;
          continue;
        }

        if (isStreamingJson) {
          jsonBuffer += textChunk;
          continue;
        }

        // Accumulate markdown content
        streamedMarkdown += textChunk;
        
        // Update the state with the accumulated markdown content
        set((state) => {
          const updatedMessages = state.messages.map(msg =>
            msg.id === state.currentStreamingMessage
              ? { ...msg, text: streamedMarkdown }
              : msg
          );
          return { 
            messages: updatedMessages,
            streamingMarkdownContent: streamedMarkdown
          };
        });
      }

      // Process JSON if present
      if (jsonBuffer) {
        console.log("Raw JSON buffer:", jsonBuffer);
        let rawJson = jsonBuffer.replace(/```json\s*/g, "");
        const closingIndex = rawJson.indexOf("```");
        if (closingIndex !== -1) {
          rawJson = rawJson.substring(0, closingIndex);
        }
        rawJson = rawJson.trim().replace(/:\s*undefined/g, ': null');

        try {
          const parsed0 = JSON.parse(rawJson);
          const parsed: AiResponse = { 
            ...parsed0, 
            response: streamedMarkdown, // Use markdown content
            next_call_prompt: parsed0.next_call_prompt || "" 
          };
          if (callMcp) callMcp(parsed);
        } catch (err) {
          console.error("Failed to parse JSON from stream:", err);
          console.error("Problematic JSON string:", JSON.stringify(rawJson));
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      set((state) => {
        const updatedMessages = state.messages.map(msg =>
          msg.id === state.currentStreamingMessage
            ? { ...msg, text: "**Error:** Could not process your request." }
            : msg
        );
        return { messages: updatedMessages };
      });
    } finally {
      set({ 
        isLoading: false, 
        currentStreamingMessage: null,
        streamingMarkdownContent: "" // Clear streaming content
      });
    }
  },

  messages: [],
  showModal: false,
  setShowModal: (value: boolean) => set({ showModal: value }),
  currentStreamingMessage: null,
  
  addMessage: (messageData: Partial<Message>) => {
    const message: Message = {
      id: messageData.id || uuidv4(),
      text: messageData.text || '',
      sender: messageData.sender || 'user',
      timestamp: messageData.timestamp || new Date(),
      isCode: messageData.isCode || false,
      isMarkdown: messageData.isMarkdown || false // Add markdown flag
    };
    set((state) => ({
      messages: [...state.messages, message]
    }));
    
    return message;
  },

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isFocused: false,
  setIsFocused: (focused) => set({ isFocused: focused }),
  latestAIMessageId: null,

  sendMessage: async (input: string, onDone: () => void, callMcp: (arg: AiResponse) => void) => {
    const { handleAIResponse } = get();
    if (!input.trim()) return;

    const messageText = input;
    onDone();
    
    await handleAIResponse(messageText, callMcp);
  },

  handleAIResponse: async (userMessage: string, callMcp) => {
    const { addMessage, setIsLoading, sendToGeminiStream, messages } = get();

    if (!userMessage.trim()) return;

    const returnedMessage = addMessage({
      sender: 'user',
      text: userMessage,
      isCode: false,
      isMarkdown: false
    });

    setIsLoading(true);

    const messages_array = [...messages, returnedMessage];

    try {
      await sendToGeminiStream(
        messages_array.map((m) => ({ 
          role: m.sender === 'ai' ? 'ai' : m.sender, 
          content: m.text 
        })), 
        callMcp
      );
    } catch (error) {
      console.error('AI Response Error:', error);
      addMessage({
        sender: 'ai',
        text: "**Error:** Sorry, I encountered an error processing your request.",
        isCode: false,
        isMarkdown: true
      });
      setIsLoading(false);
    }
  }
}));

export default useMessageStore;