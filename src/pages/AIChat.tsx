import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Bot, User } from "lucide-react";

const AIChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm MEETLY AI Assistant. How can I help you today? 🤖" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      setMessages((p) => [...p, { role: "ai", text: `Thanks for your question! I'm a demo AI assistant. In production, I'd provide a helpful response to: "${userMsg}"` }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background pt-20 px-4 pb-4 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">AI Assistant</h1>
          </div>

          <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden" style={{ minHeight: "60vh" }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {m.role === "ai" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      <span className="text-xs font-medium opacity-70">{m.role === "ai" ? "AI" : "You"}</span>
                    </div>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask AI anything..." className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="submit" className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIChat;
