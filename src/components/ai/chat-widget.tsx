import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, User, Bot, Sparkles, Copy, Share, ThumbsUp, ThumbsDown, RefreshCw, Paperclip, Mic } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import ReactMarkdown from "react-markdown";
// import { generateImage } from "../../../actions/generate-image"; 
// import { useAuth } from "../../context/auth-context"; 
import { cn } from "../../lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am your AI assistant. Ask me anything about your documents.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // const { orgId } = useAuth(); // We would get orgId from context
  const orgId = "default-org"; // Fallback for now

  useEffect(() => {
    if (scrollAreaRef.current) {
        // scroll to bottom logic if needed with scroll-area ref
    }
  }, [messages]);

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
            orgId: orgId, // TODO: Get actual orgId
            history: messages 
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        {/* Chat Window */}
        <div 
            className={cn(
                "mb-4 w-[400px] h-[600px] bg-white dark:bg-[#1F1F1F] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none hidden"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#2F2F2F] bg-white dark:bg-[#1F1F1F]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">AI Chat</h3>
                        <p className="text-xs text-muted-foreground">Ask about your docs</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" onClick={() => setMessages([{ role: 'assistant', content: 'Hi! I am your AI assistant. Ask me anything about your documents.' }])}>
                        <RefreshCw size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50/50 dark:bg-[#191919]">
                <div className="space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                             {/* Avatar */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-gray-200" : "bg-black dark:bg-white"
                            )}>
                                {msg.role === 'user' ? <User size={14} className="text-gray-600" /> : <Bot size={14} className="text-white dark:text-black" />}
                            </div>

                            {/* Content */}
                            <div className={cn(
                                "flex flex-col gap-1 max-w-[80%]",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "text-sm leading-relaxed",
                                    msg.role === 'user' 
                                        ? "bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none" 
                                        : "px-0"
                                )}>
                                    <div className="prose dark:prose-invert prose-sm max-w-none [&>p]:m-0">
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
                                
                                {/* Assistant Actions */}
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mt-1">
                                         <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><Copy size={12} /></button>
                                         <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><ThumbsUp size={12} /></button>
                                         <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><ThumbsDown size={12} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                                <Bot size={14} className="text-white dark:text-black" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-[#2F2F2F] border border-gray-100 dark:border-[#3F3F3F] shadow-sm rounded-tl-none flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#1F1F1F] border-t border-gray-100 dark:border-[#2F2F2F]">
                <div className="relative">
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <Paperclip size={16} />
                        </Button>
                     </div>
                    <input
                        className="w-full bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-[#333] text-sm rounded-full pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        placeholder="Send a message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {inputValue.trim() ? (
                             <Button 
                                size="icon" 
                                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                                onClick={handleSendMessage}
                            >
                                <Send size={14} />
                            </Button>
                        ) : (
                             <Button 
                                variant="ghost"
                                size="icon" 
                                className="w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <Mic size={16} />
                            </Button>
                        )}
                       
                    </div>
                </div>
                <div className="text-center mt-2">
                     <p className="text-[10px] text-gray-400">AI can make mistakes. Please verify important information.</p>
                </div>
            </div>
        </div>

        {/* Floating Toggle Button */}
        <Button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
                "h-14 w-14 rounded-full shadow-xl transition-all duration-300 pointer-events-auto",
                isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black"
            )}
        >
            {isOpen ? <X size={24} /> : <MessageSquare size={24} className="fill-current" />}
        </Button>
    </div>
  );
}
