import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, VideoOff, Mic, MicOff, Phone, MonitorUp, MessageSquare, Hand,
  MoreVertical, ChevronLeft, ChevronRight, Users, Timer, Bot, ClipboardList, FileText, Maximize
} from "lucide-react";

const dummyParticipants = [
  { id: "1", name: "You", isSelf: true, videoOn: true, audioOn: true },
  { id: "2", name: "Dr. Sharma", isSelf: false, videoOn: true, audioOn: true },
  { id: "3", name: "Rahul", isSelf: false, videoOn: true, audioOn: false },
  { id: "4", name: "Aditi", isSelf: false, videoOn: false, audioOn: true },
  { id: "5", name: "Priya", isSelf: false, videoOn: true, audioOn: true },
  { id: "6", name: "Arjun", isSelf: false, videoOn: true, audioOn: false },
];

const Meeting = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [activeParticipant, setActiveParticipant] = useState(dummyParticipants[1]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("chat");
  const [elapsed, setElapsed] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [handRaised, setHandRaised] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((p) => [...p, { sender: user?.name || "You", text: chatInput, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setChatInput("");
  };

  const isTeacher = user?.role === "teacher";
  const otherParticipants = dummyParticipants.filter((p) => !p.isSelf && p.id !== activeParticipant.id);

  return (
    <div className="h-screen flex flex-col meeting-bg overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 meeting-surface border-b meeting-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold meeting-text text-sm">MEETLY</span>
          <span className="text-xs meeting-text opacity-50">Meeting: {id}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full meeting-surface border meeting-border">
            <Timer className="w-3.5 h-3.5 meeting-text opacity-60" />
            <span className="text-sm font-mono meeting-text">{formatTime(elapsed)}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full meeting-surface border meeting-border">
            <Users className="w-3.5 h-3.5 meeting-text opacity-60" />
            <span className="text-sm meeting-text">{dummyParticipants.length}</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col p-3 gap-3">
          {/* Active speaker */}
          <div className="flex-1 relative rounded-2xl overflow-hidden meeting-surface border meeting-border">
            <div className="absolute inset-0 flex items-center justify-center">
              {activeParticipant.videoOn ? (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full gradient-primary flex items-center justify-center text-5xl font-bold text-primary-foreground">
                    {activeParticipant.name.charAt(0)}
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full meeting-control flex items-center justify-center text-4xl font-bold meeting-text">
                  {activeParticipant.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg glass-dark">
              <span className="text-sm font-medium meeting-text">{activeParticipant.name}</span>
              {!activeParticipant.audioOn && <MicOff className="w-3.5 h-3.5 text-destructive" />}
            </div>
            <button className="absolute top-4 right-4 p-2 rounded-lg glass-dark meeting-text opacity-60 hover:opacity-100 transition-opacity">
              <Maximize className="w-4 h-4" />
            </button>
            {/* Self mini video — PiP inside active speaker area */}
            <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl meeting-surface border meeting-border overflow-hidden shadow-lg">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                {videoOn ? (
                  <span className="text-2xl font-bold meeting-text">{user?.name?.charAt(0).toUpperCase() || "Y"}</span>
                ) : (
                  <VideoOff className="w-6 h-6 meeting-text opacity-40" />
                )}
              </div>
              <div className="absolute bottom-1 left-2 text-[10px] meeting-text bg-black/40 px-1.5 py-0.5 rounded">You</div>
            </div>
          </div>

          {/* Participant strip */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {otherParticipants.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveParticipant(p)}
                className="flex-shrink-0 w-36 h-24 rounded-xl meeting-surface border meeting-border overflow-hidden relative group hover:border-primary/50 transition-colors"
              >
                <div className="w-full h-full flex items-center justify-center">
                  {p.videoOn ? (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <span className="text-xl font-bold meeting-text">{p.name.charAt(0)}</span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold meeting-text opacity-40">{p.name.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                  <span className="text-[10px] meeting-text bg-black/40 px-1.5 py-0.5 rounded">{p.name}</span>
                  {!p.audioOn && <MicOff className="w-3 h-3 text-destructive" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="meeting-surface border-l meeting-border flex flex-col overflow-hidden"
              style={{ width: 300 }}
            >
              <div className="flex gap-1 p-2 border-b meeting-border flex-shrink-0">
                {["chat", "people", "poll", "ai", "test"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${sidebarTab === tab ? "gradient-primary text-primary-foreground" : "meeting-text opacity-60 hover:opacity-100"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {sidebarTab === "chat" ? (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.length === 0 && <p className="text-center text-xs meeting-text opacity-40 py-8">No messages yet</p>}
                    {chatMessages.map((m, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-semibold meeting-text">{m.sender}</span>
                        <span className="meeting-text opacity-40 ml-2">{m.time}</span>
                        <p className="meeting-text opacity-80 mt-0.5">{m.text}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChat} className="flex gap-2 p-3 border-t meeting-border flex-shrink-0">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send a message..."
                      className="flex-1 px-3 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none"
                    />
                    <button type="submit" className="px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs">Send</button>
                  </form>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-3">
                  {sidebarTab === "people" && (
                    <div className="space-y-2">
                      {dummyParticipants.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg meeting-control">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{p.name.charAt(0)}</div>
                          <span className="text-xs meeting-text flex-1">{p.name}{p.isSelf && " (You)"}</span>
                          {!p.audioOn && <MicOff className="w-3 h-3 text-destructive" />}
                          {!p.videoOn && <VideoOff className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>
                  )}
                  {sidebarTab === "poll" && (
                    <div className="text-center py-8">
                      {isTeacher ? (
                        <button onClick={() => navigate("/poll-create")} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Create Poll</button>
                      ) : (
                        <p className="text-xs meeting-text opacity-40">No active polls</p>
                      )}
                    </div>
                  )}
                  {sidebarTab === "ai" && (
                    <div className="text-center py-8">
                      <button onClick={() => navigate("/ai-chat")} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-2 mx-auto">
                        <Bot className="w-4 h-4" /> Open AI Chat
                      </button>
                    </div>
                  )}
                  {sidebarTab === "test" && (
                    <div className="text-center py-8">
                      {isTeacher ? (
                        <button onClick={() => navigate("/test-create")} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Create Test</button>
                      ) : (
                        <p className="text-xs meeting-text opacity-40">No active tests</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="h-20 meeting-surface border-t meeting-border flex items-center justify-center gap-3 px-4 relative">
        <button onClick={() => setAudioOn(!audioOn)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${audioOn ? "meeting-control meeting-control-hover" : "bg-destructive"}`}>
          {audioOn ? <Mic className="w-5 h-5 meeting-text" /> : <MicOff className="w-5 h-5 text-primary-foreground" />}
        </button>
        <button onClick={() => setVideoOn(!videoOn)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoOn ? "meeting-control meeting-control-hover" : "bg-destructive"}`}>
          {videoOn ? <Video className="w-5 h-5 meeting-text" /> : <VideoOff className="w-5 h-5 text-primary-foreground" />}
        </button>
        <button className="w-12 h-12 rounded-full meeting-control meeting-control-hover flex items-center justify-center">
          <MonitorUp className="w-5 h-5 meeting-text" />
        </button>
        <button onClick={() => setHandRaised(!handRaised)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${handRaised ? "bg-accent" : "meeting-control meeting-control-hover"}`}>
          <Hand className="w-5 h-5 meeting-text" />
        </button>
        <button className="w-12 h-12 rounded-full meeting-control meeting-control-hover flex items-center justify-center" onClick={() => { setSidebarOpen(!sidebarOpen); setSidebarTab("chat"); }}>
          <MessageSquare className="w-5 h-5 meeting-text" />
        </button>
        <button className="w-12 h-12 rounded-full meeting-control meeting-control-hover flex items-center justify-center" onClick={() => { setSidebarOpen(!sidebarOpen); setSidebarTab("people"); }}>
          <Users className="w-5 h-5 meeting-text" />
        </button>
        <button className="w-12 h-12 rounded-full meeting-control meeting-control-hover flex items-center justify-center">
          <MoreVertical className="w-5 h-5 meeting-text" />
        </button>
        <button onClick={() => navigate("/")} className="w-14 h-12 rounded-full bg-destructive flex items-center justify-center hover:opacity-90 transition-all ml-4">
          <Phone className="w-5 h-5 text-primary-foreground rotate-[135deg]" />
        </button>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg meeting-control meeting-control-hover">
          {sidebarOpen ? <ChevronRight className="w-4 h-4 meeting-text" /> : <ChevronLeft className="w-4 h-4 meeting-text" />}
        </button>
      </div>
    </div>
  );
};

export default Meeting;
