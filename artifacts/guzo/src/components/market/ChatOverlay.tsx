import { useState, useRef, useEffect } from "react";
import { X, Send, User, Check, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    price: string;
    currency: string;
    sellerName: string;
    imageUrl: string;
  };
};

type Message = {
  id: string;
  sender: "me" | "seller";
  text: string;
  timestamp: Date;
};

export function ChatOverlay({ isOpen, onClose, item }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      sender: "seller", 
      text: `Hello! Are you interested in the "${item.title}"?`, 
      timestamp: new Date(Date.now() - 3600000) 
    }
  ]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: inputText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    // Mock seller reply
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "seller",
        text: "Yes, I can deliver it to your location. When would you like to meet?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed inset-0 z-[60] bg-background flex flex-col md:inset-auto md:bottom-4 md:right-4 md:w-[400px] md:h-[600px] md:rounded-3xl md:shadow-2xl md:border md:border-border/60"
        >
          {/* Header */}
          <div className="p-4 border-b border-border/60 flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{item.sellerName}</div>
                <div className="text-[10px] text-green-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
              <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Item Context Card */}
          <div className="p-3 bg-muted/30 border-b border-border/40 flex gap-3">
            <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-xs font-bold text-foreground truncate">{item.title}</div>
              <div className="text-[10px] text-primary font-bold">{item.price} {item.currency}</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.sender === "me" ? "ml-auto items-end" : "items-start"
                )}
              >
                <div 
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm shadow-sm",
                    msg.sender === "me" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card border border-border/60 text-foreground rounded-tl-none"
                  )}
                >
                  {msg.text}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.sender === "me" && <Check className="h-2.5 w-2.5" />}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/60 bg-card">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="rounded-full border-border/60 bg-muted/20"
              />
              <Button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="rounded-full w-10 h-10 p-0 shadow-lg shadow-primary/20"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
