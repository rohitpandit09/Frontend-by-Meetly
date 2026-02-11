import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, ClipboardList } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const TestCreate = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  const [timeLimit, setTimeLimit] = useState(10);

  const addQuestion = () => setQuestions((p) => [...p, { question: "", options: ["", "", "", ""], correct: 0 }]);
  const removeQuestion = (i: number) => setQuestions((p) => p.filter((_, idx) => idx !== i));

  const updateQuestion = (i: number, field: string, val: string | number) => {
    setQuestions((p) => p.map((q, idx) => (idx === i ? { ...q, [field]: val } : q)));
  };

  const updateOption = (qi: number, oi: number, val: string) => {
    setQuestions((p) => p.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) } : q)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Test created! Share the test link with students.");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pt-20 px-4 pb-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display text-foreground">Create Test</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <label className="text-sm font-medium text-foreground">Time Limit (minutes)</label>
              <input type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-full mt-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {questions.map((q, qi) => (
              <div key={qi} className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Question {qi + 1}</h3>
                  {questions.length > 1 && <button type="button" onClick={() => removeQuestion(qi)} className="text-destructive hover:bg-destructive/10 p-1 rounded"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <input required value={q.question} onChange={(e) => updateQuestion(qi, "question", e.target.value)} placeholder="Enter question" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`} checked={q.correct === oi} onChange={() => updateQuestion(qi, "correct", oi)} className="accent-primary" />
                      <input required value={o} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="flex items-center gap-2 text-primary hover:underline text-sm">
              <Plus className="w-4 h-4" /> Add Question
            </button>

            <button type="submit" className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 hover:shadow-glow transition-all">
              Publish Test
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default TestCreate;
