import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClasses } from "@/contexts/ClassContext";
import { motion } from "framer-motion";
import { BookOpen, Type, FileText } from "lucide-react";

const CreateClass = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const { createClass } = useClasses();
  const navigate = useNavigate();

  if (!user || user.role !== "teacher") {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass = createClass(name, description, user.id, user.name);
    navigate(`/class/${newClass.id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">Create Class</h1>
          <p className="text-muted-foreground mt-2">Set up your new classroom</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-8 space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Class Name</label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="e.g. Computer Science 101" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" placeholder="Brief description of your class..." />
            </div>
          </div>

          <button type="submit" className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 hover:shadow-glow transition-all">
            Create Class
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateClass;
