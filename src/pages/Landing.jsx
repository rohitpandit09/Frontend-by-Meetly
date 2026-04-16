import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Video, Users, BookOpen, MessageSquare, ArrowRight, Shield, Zap, Globe } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: Video, title: "HD Meetings", desc: "Crystal-clear video calls with Google Meet-style layout" },
  { icon: Users, title: "Class Management", desc: "Create classes, manage assignments, track submissions" },
  { icon: BookOpen, title: "Smart Assignments", desc: "Create, distribute, and track assignments effortlessly" },
  { icon: MessageSquare, title: "Live Chat", desc: "Real-time class communication with notices and pins" },
  { icon: Shield, title: "Role-Based Access", desc: "Separate views and controls for teachers and students" },
  { icon: Zap, title: "AI Assistant", desc: "Built-in AI chat to help during meetings and classes" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [meetingId, setMeetingId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleJoinMeeting = async () => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    const code = meetingId.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await fetch("https://backend-by-meetly.onrender.com/api/class/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          classCode: code,
          userId: user.id || user._id,
          userName: user.name,
          role: user.role
        })
      });

      const data = await res.json();

      if (!res.ok || !data.class) {
        alert("Invalid meeting code ❌");
        return;
      }

      navigate(`/class/${data.class._id}`);
    } catch (err) {
      console.error(err);
      alert("Unable to join meeting");
    }
  };

  const handleJoinClass = async () => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError("Enter a valid invite code");
      return;
    }

    try {
      const res = await fetch("https://backend-by-meetly.onrender.com/api/class/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          classCode: code,
          userId: user.id || user._id,
          userName: user.name,
          role: user.role
        })
      });

      const data = await res.json();

      if (!res.ok || !data.class) {
        setJoinError("Invalid invite code");
        return;
      }

      navigate(`/class/${data.class._id}`);
      setJoinError("");
    } catch (err) {
      console.error(err);
      setJoinError("Something went wrong");
    }
  };
  

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/80 to-foreground/40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-16">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground/80 text-sm font-medium mb-6">
                <Globe className="w-4 h-4" /> Next-Gen Meeting Platform
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-primary-foreground leading-tight mb-6">
                Meet. Learn.
                <br />
                <span className="text-gradient">Collaborate.</span>
              </h1>
              <p className="text-lg text-primary-foreground/70 mb-8 max-w-lg">
                The all-in-one platform for online meetings, classroom management, and seamless collaboration between teachers and students.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="flex-1 flex gap-2">
                <input
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="Enter meeting code"
                  className="flex-1 px-4 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button onClick={handleJoinMeeting} className="px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-all hover:shadow-glow flex items-center gap-2">
                  Join <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {isAuthenticated && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value); setJoinError(""); }}
                  placeholder="Enter class invite code"
                  className="px-4 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent/50 transition-colors"
                />
                <button onClick={handleJoinClass} className="px-6 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-all flex items-center gap-2">
                  Join Class
                </button>
                {joinError && <span className="self-center text-destructive text-sm">{joinError}</span>}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Powerful tools designed for modern education and collaboration</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold font-display text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-hero">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold font-display text-primary-foreground mb-6">Ready to Transform Your Classroom?</h2>
            <p className="text-primary-foreground/70 text-lg mb-8">Join thousands of educators already using MEETLY.</p>
            <button onClick={() => navigate(isAuthenticated ? "/create-class" : "/signup")} className="px-8 py-4 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg hover:opacity-90 hover:shadow-glow transition-all">
              Get Started Free
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">MEETLY</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 MEETLY. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
