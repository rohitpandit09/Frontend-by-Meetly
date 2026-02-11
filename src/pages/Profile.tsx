import { useAuth } from "@/contexts/AuthContext";
import { useClasses } from "@/contexts/ClassContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Shield, BookOpen, Video } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const { classes } = useClasses();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  const userClasses = classes.filter((c) => c.members.some((m) => m.id === user.id));

  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card rounded-2xl border border-border p-8 mb-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">{user.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1 text-sm px-3 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                    <Shield className="w-3 h-3" /> {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold font-display text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> My Classes
          </h2>

          {userClasses.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <p className="text-muted-foreground">No classes yet. {user.role === "teacher" ? "Create your first class!" : "Join a class with an invite code!"}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {userClasses.map((c) => (
                <div key={c.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{c.members.length} members · Code: {c.inviteCode}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/class/${c.id}`)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
                      Chat
                    </button>
                    <button onClick={() => navigate(`/classroom/${c.id}`)} className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-accent transition-colors">
                      Classroom
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-bold font-display text-foreground mb-4 mt-8 flex items-center gap-2">
            <Video className="w-5 h-5" /> Meeting History
          </h2>
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground">No meeting history yet. Join or start a meeting to see it here.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
