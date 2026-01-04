import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Sparkles, Copy, ThumbsUp, ThumbsDown, Paperclip, Mic, MoreHorizontal, HelpCircle, Gift, Share2, RefreshCw, FileText, PlusCircle, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
    _id: string;
    title: string;
    updatedAt: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am your AI assistant. Ask me anything about your documents.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const orgId = "default-org"; 

  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
     const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
     if (scrollContainer) {
         scrollContainer.scrollTop = scrollContainer.scrollHeight;
     }
  }, [messages]);

  // Fetch Chat History List
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
      try {
          const res = await fetch(`/api/ai/chats?orgId=${orgId}`);
          const data = await res.json();
          if(data.chats) {
              setChats(data.chats);
          }
      } catch (err) {
          console.error("Failed to fetch chats", err);
      }
  };

  const loadChat = async (chatId: string) => {
      if(currentChatId === chatId) return;
      setIsLoading(true);
      try {
          const res = await fetch(`/api/ai/chats/${chatId}`);
          const data = await res.json();
          if(data.chat) {
              setMessages(data.chat.messages);
              setCurrentChatId(chatId);
          }
      } catch (err) {
          console.error("Failed to load chat", err);
      } finally {
          setIsLoading(false);
      }
  };

  const startNewChat = () => {
      setCurrentChatId(null);
      setMessages([{ role: 'assistant', content: 'Hi! I am your AI assistant. Ask me anything about your documents.' }]);
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
      e.stopPropagation();
      if(!confirm("Are you sure you want to delete this chat?")) return;

      try {
          const res = await fetch(`/api/ai/chats/${chatId}`, { method: 'DELETE' });
          if(res.ok) {
              setChats(prev => prev.filter(c => c._id !== chatId));
              if(currentChatId === chatId) {
                  startNewChat();
              }
          }
      } catch (err) {
          console.error("Failed to delete chat", err);
      }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // Initial placeholder for assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: userMsg.content,
            orgId: orgId,
            chatId: currentChatId, 
        }),
      });

      if (!response.ok || !response.body) {
         throw new Error("Failed to fetch response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunkValue = decoder.decode(value, { stream: true });
          
          setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === 'assistant') {
                  lastMsg.content += chunkValue;
              }
              return newMessages;
          });
      }

      // Refresh chat list after stream ends to update history title if new
      fetchChats();

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
           const newMessages = [...prev];
           const lastMsg = newMessages[newMessages.length - 1];
           if (lastMsg.role === 'assistant') {
               lastMsg.content += "\n\n[Error: Connection interrupted]";
           }
           return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-[#f8f9fb] dark:bg-[#191919]">
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative mr-80"> {/* Margin for fixed sidebar */}
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-8 bg-white dark:bg-[#1F1F1F] border-b border-gray-100 dark:border-[#2F2F2F]">
                <h1 className="font-bold text-xl">AI Chat</h1>
                <div className="flex items-center gap-4">
                     <Button size="sm" className="bg-[#1C1C1C] hover:bg-black text-white dark:bg-white dark:text-black rounded-lg h-9 px-4 text-xs font-bold transition-transform active:scale-95">
                        <Sparkles size={14} className="mr-2 text-yellow-400" /> Upgrade
                     </Button>
                     <button className="text-gray-400 hover:text-gray-600 transition"><HelpCircle size={20} /></button>
                     <button className="text-gray-400 hover:text-gray-600 transition"><Gift size={20} /></button>
                     <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center relative">
                        <Bot size={18} className="text-green-600" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                     </div>
                </div>
            </div>

            {/* Chat Messages */}
             <ScrollArea className="flex-1 p-8">
                <div className="max-w-3xl mx-auto space-y-8 pb-10">
                    {messages.map((msg, idx) => (
                        <div key={idx} className="flex gap-4 group">
                             {/* Avatar */}
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-gray-100 shadow-sm",
                                msg.role === 'user' ? "bg-white overflow-hidden" : "bg-black text-white"
                            )}>
                                {msg.role === 'user' ? (
                                    <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
                                ) : (
                                    <Bot size={20} />
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                {/* Message Bubble */}
                                <div className={cn(
                                    "text-[15px] leading-relaxed",
                                    msg.role === 'user' ? "font-medium text-gray-800 dark:text-gray-200 py-2" : "text-gray-600 dark:text-gray-300"
                                )}>
                                     {msg.role === 'user' ? (
                                         <div className="bg-white dark:bg-[#2F2F2F] border border-gray-100 dark:border-[#3F3F3F] px-5 py-3 rounded-[20px] rounded-tl-none inline-block shadow-sm">
                                            {msg.content}
                                         </div>
                                     ) : (
                                        <div className="px-1 is-assistant-message">
                                            <div className="prose dark:prose-invert prose-sm max-w-none [&>ol]:list-decimal [&>ol]:pl-4 [&>ul]:list-disc [&>ul]:pl-4">
                                                <ReactMarkdown 
                                                    components={{
                                                        pre: ({node, ...props}) => (
                                                            <div className="overflow-auto w-full my-2 bg-black/5 dark:bg-black/50 p-4 rounded-lg">
                                                                <pre {...props} />
                                                            </div>
                                                        ),
                                                        code({ node, className, children, ...props }) {
                                                            const match = /language-(\w+)/.exec(className || '');
                                                            return match ? (
                                                                <code className={`${className} bg-transparent`} {...props}>
                                                                    {children}
                                                                </code>
                                                            ) : (
                                                                <code className="bg-gray-100 dark:bg-[#333] rounded px-1.5 py-0.5 font-mono text-sm" {...props}>
                                                                    {children}
                                                                </code>
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                     )}
                                </div>

                                {/* Assistant Actions */}
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-3 pl-5 pt-2">
                                         <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition"><ThumbsUp size={14} /></button>
                                         <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition"><ThumbsDown size={14} /></button>
                                         <div className="flex-1"></div>
                                         <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition"><Copy size={14} /> Copy</button>
                                         <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition"><Share2 size={14} /> Share</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                                <Bot size={20} />
                            </div>
                            <div className="flex items-center gap-1 h-10">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-8 pt-0">
                 <div className="max-w-3xl mx-auto space-y-4">
                     {/* Regenerate Button */}
                     {!isLoading && messages.length > 1 && (
                         <div className="flex justify-center">
                             <Button variant="outline" className="bg-white h-9 text-xs font-medium text-gray-600 gap-2 shadow-sm hover:bg-gray-50">
                                 <RefreshCw size={12} /> Regenerate
                             </Button>
                         </div>
                     )}

                     {/* Main Input Box */}
                     <div className="bg-white dark:bg-[#1F1F1F] rounded-[24px] border border-gray-200 dark:border-[#333] shadow-xl shadow-black/5 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-2 relative">
                         <textarea
                            className="w-full bg-transparent border-0 text-sm px-4 py-3 min-h-[50px] max-h-48 resize-none focus:outline-none placeholder:text-gray-400 font-medium"
                            placeholder="Send a message..."
                            rows={1}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                         />
                         
                         {/* Bottom Toolbar */}
                         <div className="flex items-center justify-between px-2 pb-1">
                             <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 gap-2 px-3 text-xs font-medium">
                                    <Paperclip size={14} /> Attach
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 gap-2 px-3 text-xs font-medium">
                                    <Mic size={14} /> Voice Message
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 gap-2 px-3 text-xs font-medium">
                                    <FileText size={14} /> Browse Prompts
                                </Button>
                             </div>

                             <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-300 font-medium">{inputValue.length}/3,000</span>
                                <Button 
                                    size="icon" 
                                    disabled={!inputValue.trim()}
                                    className={cn(
                                        "w-8 h-8 rounded-lg transition-all",
                                        inputValue.trim() ? "bg-black text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400"
                                    )}
                                    onClick={handleSendMessage}
                                >
                                    <Send size={14} />
                                </Button>
                             </div>
                         </div>
                     </div>

                     <p className="text-center text-[11px] text-gray-400 font-medium">
                        Script may generate inaccurate information about people, places, or facts. Model: Script UI v1.3
                     </p>
                 </div>
            </div>
        </div>

        {/* Right Sidebar (Fixed) */}
        <div className="w-80 h-full border-l border-gray-100 dark:border-[#2F2F2F] bg-white dark:bg-[#1F1F1F] flex flex-col fixed right-0 top-0 bottom-0 z-10 shadow-[-5px_0_15px_rgba(0,0,0,0.02)]">
             <div className="p-6 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-gray-800 dark:text-gray-100">Projects</h2>
                    <span className="text-gray-400 text-xs font-medium">({chats.length})</span>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={startNewChat}
                        className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-[#2F2F2F] transition-colors"
                        title="New Chat"
                    >
                        <PlusCircle size={16} />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={16} /></button>
                </div>
             </div>
             
             <ScrollArea className="flex-1 px-4 py-2">
                 <div className="space-y-3">
                    {chats.map((chat) => (
                        <div 
                            key={chat._id} 
                            onClick={() => loadChat(chat._id)}
                            className={cn(
                                "p-4 border border-gray-100 dark:border-[#333] rounded-xl hover:shadow-md cursor-pointer transition-all group relative",
                                currentChatId === chat._id ? "bg-gray-50 dark:bg-[#262626] border-blue-500/20" : "bg-white dark:bg-[#1C1C1C]"
                            )}
                        >
                            <div className="pr-6">
                                <h4 className={cn(
                                    "text-[13px] font-semibold truncate mb-1",
                                    currentChatId === chat._id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
                                )}>
                                    {chat.title}
                                </h4>
                                <p className="text-[11px] text-gray-400 truncate font-medium flex items-center gap-1">
                                    <MessageSquare size={10} /> 
                                    {new Date(chat.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className={cn(
                                "absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2",
                                currentChatId === chat._id ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                            )}>
                                <button 
                                    onClick={(e) => deleteChat(e, chat._id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Delete Chat"
                                >
                                    <Trash2 size={14} />
                                </button>
                                {currentChatId === chat._id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                )}
                            </div>
                        </div>
                    ))}
                 </div>
             </ScrollArea>
        </div>

    </div>
  );
}
