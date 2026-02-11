import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, BarChart3 } from "lucide-react";

const PollCreate = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => setOptions((p) => [...p, ""]);
  const removeOption = (i: number) => setOptions((p) => p.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions((p) => p.map((o, idx) => (idx === i ? val : o)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Poll created! Returning to meeting.");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pt-20 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display text-foreground">Create Poll</h1>
          </div>
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-8 space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Question</label>
              <input required value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="What's your question?" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Options</label>
              {options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input value={o} onChange={(e) => updateOption(i, e.target.value)} required className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={`Option ${i + 1}`} />
                  {options.length > 2 && <button type="button" onClick={() => removeOption(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
              <button type="button" onClick={addOption} className="flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="w-4 h-4" /> Add Option</button>
            </div>
            <button type="submit" className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90">Create Poll</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PollCreate;
