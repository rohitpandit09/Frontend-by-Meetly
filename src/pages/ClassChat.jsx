import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Send, Pin, Users, Bell, BookOpen, Video, Copy, Check } from "lucide-react";
import { socket } from "@/sockets/socket";

const ClassChat = () => {
  
  const { id } = useParams();
  console.log("CLASS ID:", id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [copied, setCopied] = useState(false);
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [classData, setClassData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeText, setNoticeText] = useState("");

  const togglePinMessage = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
      )
    );
  };


  useEffect(() => {
    const fetchClass = async () => {
      try {
        if (!id) return;
        const res = await fetch(`https://backend-by-meetly.onrender.com/api/class/${id}`);
        const data = await res.json();

        if (!data.class) {
          console.error("Class not found");
          return;
        }

        setClassData(data.class);
        setMessages(
          (data.class.messages || []).map((msg) => ({
            ...msg,
            id: msg._id || Math.random().toString(36).substr(2, 9)
          }))
        );
        setMeetingStarted(Boolean(data.class.isMeetingStarted));
      } catch (err) {
        console.error(err);
      }
    };

    fetchClass();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;

    socket.emit("join_class", {
      classId: id,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

    const handleOnline = (users) => {
      setOnlineUsers(users);
    };

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          id: msg._id || Math.random().toString(36).substr(2, 9)
        }
      ]);
    };

    const handleMeetingStarted = () => {
      setMeetingStarted(true);
    };

    socket.on("online_users", handleOnline);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("meeting_started", handleMeetingStarted);

    return () => {
      socket.off("online_users", handleOnline);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("meeting_started", handleMeetingStarted);
    };
  }, [user, id]);

   if (!user) { navigate("/login"); return null; }
   if (!classData) return <div>Class not found or loading...</div>;

  const isTeacher = user.role === "teacher";

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const msg = {
      classId: id,
      sender: user.name,
      role: user.role,
      content: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      isNotice: false
    };

    socket.emit("send_message", msg);
    setMessage("");
  };


  const copyCode = () => {
    navigator.clipboard.writeText(classData.classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const notices = messages.filter((m) => m.isNotice === true);
  const onlineCount = onlineUsers.length;

  const handleStartMeeting = async () => {
    try {
      await fetch(`https://backend-by-meetly.onrender.com/api/class/start/${classData._id}`, {
        method: "POST"
      });

      socket.emit("start_meeting", { classId: id });
      setMeetingStarted(true);
      navigate(`/meeting/${classData._id}`);
    } catch (err) {
      console.error(err);
      alert("Unable to launch meeting");
    }
  };

console.log("URL ID:", id);
console.log("CLASS ID:", id);
console.log("CLASS DATA:", classData);

  return (
    <div className="min-h-screen bg-background pt-20 px-4 pb-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">{classData.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{classData.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> {onlineUsers.length} members · {onlineCount} online
                </span>
                <button onClick={copyCode} className="text-xs flex items-center gap-1 text-primary hover:underline">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : classData.classCode}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {/* TEACHER */}
              {isTeacher && !meetingStarted && (
                <button
                  onClick={handleStartMeeting}
                  className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <Video className="w-4 h-4" /> Start Meeting
                </button>
              )}

              <button
                onClick={() => navigate(`/classroom/${id}`)}
                className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Classroom
              </button>

              {/* STUDENT */}
              {!isTeacher && meetingStarted && (
                <button
                  onClick={() => navigate(`/meeting/${classData._id}`)}
                  className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <Video className="w-4 h-4" /> Join Meeting
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-muted rounded-xl p-1">
            {["chat", "notices", "members"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "chat" && "💬 "}
                {tab === "notices" && "📢 "}
                {tab === "members" && "👥 "}
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden" style={{ height: "calc(100vh - 340px)" }}>
            {activeTab === "chat" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === user.name ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.isNotice ? "bg-accent/20 border border-accent/30" : msg.sender === user.name ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold opacity-80">{msg.sender}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${msg.role === "teacher" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {msg.role}
                          </span>
                          {msg.isPinned && <Pin className="w-3 h-3 text-accent" />}
                          {msg.isNotice && <Bell className="w-3 h-3 text-accent" />}
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-[10px] opacity-60 mt-1 block">{msg.time}</span>
                      </div>
                      {isTeacher && (
                        <button onClick={() => togglePinMessage(msg.id)} className="text-[10px] text-muted-foreground hover:text-primary mt-1 px-2">
                          {msg.isPinned ? "Unpin" : "Pin"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                  {isTeacher && (
                    <button type="button" onClick={() => setShowNoticeModal(true)} className="px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90">
                      📢
                    </button>
                  )}
                  <button type="submit" className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {activeTab === "notices" && (
              <div className="p-4 space-y-3 overflow-y-auto h-full">
                {notices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No notices yet
                  </p>
                ) : (
                  notices.map((n, index) => (
                    <div key={index} className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-accent" />
                        <span className="text-sm font-semibold text-foreground">
                          {n.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "members" && (
              <div className="p-4 space-y-2 overflow-y-auto h-full">
                {onlineUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No users online
                  </p>
                ) : (
                  onlineUsers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {m.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card bg-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                        Online
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Post Notice</h2>

            <textarea
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              placeholder="Write your notice..."
              className="w-full p-3 border rounded-lg mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNoticeModal(false)}
                className="px-4 py-2 bg-muted rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!noticeText.trim()) return;

                  const msg = {
                    classId: id,
                    sender: user.name,
                    role: "teacher",
                    content: noticeText,
                    time: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    }),
                    isNotice: true
                  };

                  socket.emit("send_message", msg);

                  setNoticeText("");
                  setShowNoticeModal(false);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                Post Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassChat;
