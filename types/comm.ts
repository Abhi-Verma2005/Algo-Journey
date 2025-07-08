export interface CommMessage {
  version: "new_chat_room" | "message" | "config_update" | "system_ping" | "contest_update" | "response_from_mcp" | "ai_reply" | "get_user_details" | "get_next_question";
  sender: "system" | "user";
  user_apikey?: string;
  //unique identifier for the user
  user_email?: string;
  ai_response?: string;
  messages?: Message[];
  config?: UserConfig;
  config_updated?: boolean
}

export interface MessageAi {
  role: "system" | "user" | "ai",
  content: string
}

export interface UserConfig {
  // this will be fetched on load and sent as fresh data  
  userEmail: string;
  leetcode_questions_solved: number;
  // this will be fetched on load and sent as fresh data 
  codeforces_questions_solved: number;
  //to guess user level 
  rank: "novice_1" | "novice_2" | "learner_1" | "learner_2" | "competent_1" | "advanced" | "expert";
  // will include journey type ones the schema is done
  //entered by ai as a review of common solving habits of user and scope of improvements
  user_brief: string
}

export interface SystemConfig {
  tags: string[];
  teaching_style: string;

}

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user' | 'system';
  timestamp: Date;
  isCode?: boolean;
  isMarkdown?: boolean
}

export interface AiResponse {
  call_mcp: boolean;
  function_to_call: "get_user_details";
  next_call_prompt: string | undefined
}
