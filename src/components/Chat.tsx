'use client'
import React, { useRef, useEffect, useState } from 'react';
import { Check, Clipboard, User, Send, X, Brain, Settings } from 'lucide-react';
import useMessageStore from '@/store/messages';
import toast from 'react-hot-toast';
import useStore from '@/store/store';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/SocketContext';
import { AiResponse, CommMessage } from '../../types/comm';
import axios from 'axios';
import { fetchUserStats } from '@/serverActions/fetch';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark-dimmed.css";





const ChatComponent: React.FC = () => {
  const { 
    messages, 
    isLoading,
    sendMessage, 
    userApiKey
  } = useMessageStore();
  const { status } = useSession();
  const { data:session } = useSession()
  const { websocket } = useSocket()
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { setUserApikey, setUserConfig, userConfig, addMessage } = useMessageStore()
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showToneChanger, setShowToneChanger] = useState(false);
  const { isDarkMode, setPUsernames } = useStore()
  const [currentTone, setCurrentTone] = useState("juggernaut");
  const DEFAULT_HEIGHT = "40px";
  const MAX_HEIGHT = 150;
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSubmittingApiKey, setIsSubmittingApiKey] = useState(false);


  const tones = [
    { id: "juggernaut", name: "Juggernaut", description: "Detailed, balanced and comprehensive analysis" },
    { id: "legal", name: "Legal Check", description: "Focuses only on legality and compliance issues" },
    { id: "concise", name: "Concise", description: "Brief, to-the-point responses" },
    { id: "creative", name: "Creative", description: "Imaginative and innovative perspectives" },
    { id: "technical", name: "Technical", description: "In-depth, specialized analysis" }
  ];

  useEffect(() => {

    const getUserConfig = async () => {
      try {
        const response = await axios.get(`/api/user/user-config`);
        // config not found hence will create one 
        const usernameRes = await axios.get<{ leetcodeUsername: string; codeforcesUsername: string }>("/api/user/username");
        setPUsernames({ leetcodeUsername: usernameRes.data.leetcodeUsername, codeforcesUsername: usernameRes.data.codeforcesUsername })
        const leetcodeResponse = await fetchUserStats(usernameRes.data.leetcodeUsername)
        // have to add codeforces condition too
          if (response.data.leetcode_questions_solved !== leetcodeResponse?.totalSolved){
            try{
              const userConfigUpdateResponse = await axios.patch("/api/user/user-config", { 
              leetcode_questions_solved: leetcodeResponse?.totalSolved,
              codeforces_questions_solved: 0 
            })
            if(userConfigUpdateResponse.status === 200){
              setUserConfig(userConfigUpdateResponse.data)
              toast.success("User Data Updated")
            }
            } catch(error) {
              console.error("Error occured while updating user-config: ", error)
            }

          } 
          if(response.data.message === "Config not found") {
            try{
              const userConfigCreateResponse = await axios.post("/api/user/user-config", { 
              leetcode_questions_solved: leetcodeResponse?.totalSolved,
              codeforces_questions_solved: 0 
            })
            if(userConfigCreateResponse.status === 200){
              toast.success("User Data Updated")
            }

            } catch(error) {
              console.error("Error occured while creating user-config: ", error)
            }
          
            // not adding message in everycondition fix that

            setUserConfig(response.data)
                
          }

          else{

            setUserConfig(response.data)
          }
        return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user config:', error);
      return null;
    }
    }

    getUserConfig()
 
  }, [])
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
  // Check if user has API key on component mount
  const checkApiKey = async () => {
    try {
      if(status === "unauthenticated") return 
      const response = await fetch('/api/user/apikey');
      if (response.ok) {
        const data = await response.json();
        setHasApiKey(data.hasApiKey);
        setUserApikey(data.apiKey)
        if (!data.hasApiKey) {
          setShowApiKeyModal(true);
        }
      }
      const message: CommMessage = {
        version: "new_chat_room",
        sender: "system",
        user_email: session?.user.email || "",
      }
      const toSend = JSON.stringify(message)
      websocket?.send(toSend)
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasApiKey(false);
      setShowApiKeyModal(true);
    }
  };

  checkApiKey();
}, [status]);
  
  useEffect(() => {
    if (textAreaRef.current?.value.trim() === '') {
      resetTextAreaHeight();
    } else {
      adjustTextAreaHeight();
    }
  }, [textAreaRef.current?.value]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const resetTextAreaHeight = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = DEFAULT_HEIGHT;
    }
  };

  const adjustTextAreaHeight = () => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
    
    textArea.style.height = "auto";
    
    const newHeight = Math.min(textArea.scrollHeight, MAX_HEIGHT);
    textArea.style.height = `${newHeight}px`;
  };

  const handleInput = () => {
    if (textAreaRef.current?.value.trim() === '') {
      resetTextAreaHeight();
    } else {
      adjustTextAreaHeight();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if(!textAreaRef?.current?.value) return 
      
    sendMessage(textAreaRef.current?.value, () => {
        if(textAreaRef?.current?.value){
          textAreaRef.current.value = ""
        }
      }, (message: AiResponse) => {

    const messageToSend: CommMessage = {
        version: message.function_to_call!,
        sender: "system",
        ai_response: message.next_call_prompt,
        user_email: session?.user.email || "",
        user_apikey: userApiKey
    }


    if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(messageToSend));
    } else {
    console.error("WebSocket not ready");
    }
})
    }
  };
  
  const handlePaste = () => {
    setTimeout(() => {
      adjustTextAreaHeight();
    }, 0);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      toast.success("Copied to clipboard! 📋");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy! ❌");
    }
  };
  
  const handleClearInput = () => {
    if(textAreaRef.current?.value){
          textAreaRef.current.value = ""
        }
    resetTextAreaHeight();
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  const toggleToneChanger = () => {
    setShowToneChanger(!showToneChanger);
    setShowPrompts(false);
  };

  const changeTone = (toneId: string) => {
    setCurrentTone(toneId);
    setShowToneChanger(false);
    
    const toneName = tones.find(t => t.id === toneId)?.name || "Default";
    toast.success(`Tone changed to ${toneName}! 🎭`);
  };

  const isEmpty = textAreaRef.current?.value.trim() === '';

  const getToneIndicator = () => {
    const tone = tones.find(t => t.id === currentTone);
    return tone?.name || "Juggernaut";
  };

  const handleApiKeySubmit = async () => {
  if (!apiKeyInput.trim()) {
    toast.error('Please enter your API key');
    return;
  }

  setIsSubmittingApiKey(true);
  try {
    const response = await fetch('/api/user/apikey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey: apiKeyInput }),
    });

    if (response.ok) {
      setHasApiKey(true);
      const data = await response.json()
      setUserApikey(data.apikey)
      setShowApiKeyModal(false);
      setApiKeyInput('');
      toast.success('API key saved successfully! 🔐');
    } else {
      const error = await response.json();
      toast.error(error.message || 'Failed to save API key');
    }
  } catch (error) {
    console.error('Error saving API key:', error);
    toast.error('Failed to save API key');
  } finally {
    setIsSubmittingApiKey(false);
  }
};

const closeApiKeyModal = () => {
  if (hasApiKey) {
    setShowApiKeyModal(false);
    setApiKeyInput('');
  }
};

  return (
  <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
    <div className="flex flex-col pb-40 w-full h-[100vh] max-w-[70%] mx-auto relative">
    <div className={`flex-1 p-4 pt-24 overflow-y-auto relative ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
    

{messages.length === 0 ? (
  <div className={`flex flex-col items-center justify-center h-full ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
    <p className="text-center">Chat with Juggernaut</p>
  </div>
) : (
  messages
  .filter((f) => (f.sender !== "system"))
  .map((message, idx) => (
    <div 
      key={message.id} 
      className={`flex mb-6 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.sender === 'user' ? (
        // User message with bubble
        <div className="relative max-w-3/4 bg-gradient-to-r from-blue-800 to-blue-800 text-white rounded-lg rounded-br-none p-3">
          <div className="flex flex-col w-full">
            <div className="flex items-center mb-1">
              <User size={16} className="mr-1 text-white" />
              <span className="text-xs opacity-70 mx-1">
                You • {formatTime(message.timestamp)}
              </span>
            </div>
            
            <div className="w-full p-3">
              <div className="prose max-w-none rounded-xl prose-p:leading-loose prose-p:mb-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            </div>

            <button 
              className="absolute bottom-2 right-2 p-1 rounded-md transition-all text-white hover:text-blue-200"
              onClick={() => copyToClipboard(message.text, message.id)}
            >
              {copiedMessageId === message.id ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Clipboard size={16}/>
              )}
            </button>
          </div>
        </div>
      ) : (
        // AI message without bubble - directly on ground
        <div className="w-full max-w-[85%]">
          <div className={`flex items-center mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            <Brain className="size-4 mr-2"/>
            <span className="text-sm font-medium">Jugg</span>
            <span className={`text-xs opacity-70 ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
            </span>
          </div>
          
          <div className={`relative prose prose-md max-w-none ${
            isDarkMode ? 'prose-invert text-gray-100' : 'prose-gray text-gray-800'
          }`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {message.text}
            </ReactMarkdown>
            
            <button 
              className={`absolute top-2 right-2 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => copyToClipboard(message.text, message.id)}
            >
              {copiedMessageId === message.id ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Clipboard size={16}/>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  ))
)}

{isLoading && (
  <div className="flex mb-6 justify-start">
    <div className="w-full max-w-[85%]">
      <div className={`flex items-center mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
        <Brain className="size-4 mr-2"/>
        <span className="text-sm font-medium">Jugg</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <p className={`text-xl font-semibold text-transparent bg-clip-text bg-[linear-gradient(to_right,#2563eb_0%,#60a5fa_50%,#2563eb_100%)] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite_linear] ${
          isDarkMode ? 'bg-[linear-gradient(to_right,#60a5fa_0%,#93c5fd_50%,#60a5fa_100%)]' : ''
        }`}>
          Thinking...
        </p>
      </div> 
    </div>
  </div>
)}
      <div ref={messagesEndRef} />
    </div>
    
    <div
      className="fixed left-1/2 transform -translate-x-1/2 bottom-10 w-full max-w-3xl p-[2px] rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient border */}
      <div 
        className={`absolute inset-0 rounded-xl border-[2px] border-transparent transition-all duration-300
        ${isDarkMode 
          ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-teal-400' 
          : 'bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400'
        }
        ${isHovered ? 'opacity-100' : 'opacity-75'}`}
      />

      <div onClick={() => {
        textAreaRef.current?.focus()
      }} className={`relative w-full h-full rounded-xl cursor-text p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Quick Prompts Panel */}
        {showPrompts && (
          <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-lg p-2 z-10 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-blue-100'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-2 ${
              isDarkMode ? 'border-b border-gray-700' : 'border-b border-blue-50'
            }`}>
              <h3 className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Quick Prompts</h3>
              <button 
                onClick={() => setShowPrompts(false)}
                className={`p-1 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-blue-400' 
                    : 'hover:bg-blue-50 text-blue-500'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Tone Changer Panel */}
        {showToneChanger && (
          <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-lg p-2 z-10 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-blue-100'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-2 ${
              isDarkMode ? 'border-b border-gray-700' : 'border-b border-blue-50'
            }`}>
              <div className={`flex items-center ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <Settings size={16} className="mr-1" />
                <h3 className="font-medium">Response Tone</h3>
              </div>
              <button 
                onClick={() => setShowToneChanger(false)}
                className={`p-1 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-blue-400' 
                    : 'hover:bg-blue-50 text-blue-500'
                }`}
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                Choose how you want Juggernaut to respond:
              </p>
              <div className="space-y-2">
                {tones.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => changeTone(tone.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-md transition-all
                      ${currentTone === tone.id ? 
                        isDarkMode
                          ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-700'
                      }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{tone.name}</span>
                      <span className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-slate-500'
                      }`}>{tone.description}</span>
                    </div>
                    {currentTone === tone.id && (
                      <Check size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Text area container */}
        <form onSubmit={(e) => { 
          e.preventDefault();
          if(!textAreaRef.current?.value) return 
           sendMessage(textAreaRef.current?.value, () => {
                if(textAreaRef?.current?.value){
                  textAreaRef.current.value = ""
                }
              }, (message: AiResponse) => {

            const messageToSend: CommMessage = {
                version: message.function_to_call!,
                sender: "system",
                user_email: session?.user.email || ""
            }

            if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify(messageToSend));
            } else {
            console.error("WebSocket not ready");
            }
        })
         }} className="w-full">
          <div className="relative">
            <textarea
              ref={textAreaRef}
              className={`w-full px-3 py-2 text-base font-light outline-none focus:ring-0 focus:border-transparent rounded-lg resize-none font-sans ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-100 placeholder:text-gray-400' 
                  : 'bg-blue-50 text-slate-800 placeholder:text-slate-400'
              }`}
              placeholder="Message Jugg..."
              rows={1}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onPaste={handlePaste}
              style={{ height: DEFAULT_HEIGHT }} // Initial fixed height
            />
            
            {/* Send button */}
            <button 
              type="submit" 
              disabled={isEmpty}
              className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-all duration-200
                ${isEmpty 
                  ? isDarkMode
                    ? "bg-gray-600 text-gray-400"
                    : "bg-slate-200 text-slate-400"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600"}`}
            >
              <Send size={16} className={isEmpty ? "opacity-50" : "opacity-100"} />
            </button>
            
            {/* Clear button - only show when input has content */}
            {!isEmpty && (
              <button 
                type="button"
                onClick={handleClearInput}
                className={`absolute right-10 bottom-2 p-1.5 rounded-md transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Toolbar */}
        <div className="flex items-center mt-2 px-1">
          <div className="flex items-center space-x-1">
            <button 
              onClick={toggleToneChanger}
              className={`p-1 rounded-md transition-all ${
                showToneChanger 
                  ? isDarkMode
                    ? 'bg-gray-700 text-blue-400' 
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                    : 'text-blue-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Change response tone"
            >
              <Settings className="size-4" />
            </button>
          </div>
          
          <div className="ml-auto flex items-center">
            {/* Tone indicator badge */}
            <div className={`mr-2 px-2 py-0.5 rounded-full text-xs ${
              isDarkMode 
                ? 'bg-blue-900/50 text-blue-300' 
                : 'bg-blue-50 text-blue-600'
            }`}>
              {getToneIndicator()}
            </div>
            <div className={`text-xs font-medium ${
              isDarkMode ? 'text-blue-400' : 'text-blue-500'
            }`}>
              {textAreaRef.current?.value && textAreaRef.current?.value.length > 0 && `${textAreaRef.current?.value.length} characters`}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* API Key Modal */}
{showApiKeyModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className={`max-w-md w-full mx-4 p-6 rounded-xl shadow-xl ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-blue-100'
    }`}>
      <div className="text-center mb-6">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'
        }`}>
          <Brain className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Connect Your AI
        </h3>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          To start chatting with Juggernaut, please enter your OpenAI API key. 
          Your key is encrypted and stored securely.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            API Key
          </label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
          />
        </div>

        <div className={`text-xs p-3 rounded-lg ${
          isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
        }`}>
          🔒 Your API key is encrypted using AES-256 encryption and stored securely in our database.
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleApiKeySubmit}
            disabled={isSubmittingApiKey || !apiKeyInput.trim()}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              isSubmittingApiKey || !apiKeyInput.trim()
                ? isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
            }`}
          >
            {isSubmittingApiKey ? 'Saving...' : 'Save API Key'}
          </button>
          
          {hasApiKey && (
            <button
              onClick={closeApiKeyModal}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}
  </div>
);
};

export default ChatComponent;