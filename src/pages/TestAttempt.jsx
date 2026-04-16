import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Clock, Video, VideoOff, Mic, MicOff, CheckCircle } from "lucide-react";

const demoQuestions = [
  { question: "What is React?", options: ["A database", "A JS library", "A CSS framework", "An OS"], correct: 1 },
  { question: "What hook manages state?", options: ["useEffect", "useState", "useRef", "useMemo"], correct: 1 },
  { question: "JSX stands for?", options: ["JavaScript XML", "Java Syntax Extension", "JSON Extra", "JS Extension"], correct: 0 },
];

const TestAttempt = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState(demoQuestions.map(() => null));
  const [timeLeft, setTimeLeft] = useState(600);
  const [submitted, setSubmitted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { handleSubmit(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const score = answers.reduce((acc, a, i) => acc + (a === demoQuestions[i].correct ? 1 : 0), 0);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-card rounded-2xl border border-border p-12 max-w-md">
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">Test Submitted!</h1>
          <p className="text-muted-foreground mb-4">Your score: {score}/{demoQuestions.length}</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90">Back to Home</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg meeting-surface border meeting-border overflow-hidden flex items-center justify-center">
            {videoOn ? <span className="text-sm font-bold meeting-text">{user?.name?.charAt(0) || "Y"}</span> : <VideoOff className="w-4 h-4 text-muted-foreground" />}
          </div>
          <span className="text-sm font-medium text-foreground">{user?.name || "Student"}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full ${timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"}`}>
          <Clock className="w-4 h-4" />
          <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {demoQuestions.map((q, qi) => (
            <motion.div key={qi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.1 }} className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Q{qi + 1}. {q.question}</h3>
              <div className="grid gap-2">
                {q.options.map((o, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers((p) => p.map((a, i) => (i === qi ? oi : a)))}
                    className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      answers[qi] === oi ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/30 text-foreground"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="h-16 bg-card border-t border-border flex items-center justify-between px-4">
        <div className="flex gap-2">
          <button onClick={() => setVideoOn(!videoOn)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${videoOn ? "bg-muted" : "bg-destructive"}`}>
            {videoOn ? <Video className="w-4 h-4 text-foreground" /> : <VideoOff className="w-4 h-4 text-primary-foreground" />}
          </button>
          <button onClick={() => setAudioOn(!audioOn)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${audioOn ? "bg-muted" : "bg-destructive"}`}>
            {audioOn ? <Mic className="w-4 h-4 text-foreground" /> : <MicOff className="w-4 h-4 text-primary-foreground" />}
          </button>
        </div>
        <button onClick={handleSubmit} className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 hover:shadow-glow transition-all">
          Submit Test
        </button>
      </div>
    </div>
  );
};

export default TestAttempt;
