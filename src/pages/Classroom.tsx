import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClasses } from "@/contexts/ClassContext";
import { motion } from "framer-motion";
import { Users, FileText, Upload, CheckCircle, XCircle, Clock, ArrowLeft, Plus } from "lucide-react";

const Classroom = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { getClass, addAssignment, submitAssignment } = useClasses();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"members" | "assignments">("assignments");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");

  const classData = getClass(id || "");

  if (!user) { navigate("/login"); return null; }
  if (!classData) return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16">
      <p className="text-muted-foreground">Class not found.</p>
    </div>
  );

  const isTeacher = user.role === "teacher";

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    addAssignment(classData.id, { title, description: desc, dueDate });
    setTitle(""); setDesc(""); setDueDate(""); setShowCreate(false);
  };

  const handleSubmit = (assignmentId: string) => {
    submitAssignment(classData.id, assignmentId, user.id, user.name, `${user.name}_submission.pdf`);
  };

  return (
    <div className="min-h-screen bg-background pt-20 px-4 pb-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(`/class/${classData.id}`)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">{classData.name} — Classroom</h1>
              <p className="text-sm text-muted-foreground">{classData.members.length} members · {classData.assignments.length} assignments</p>
            </div>
          </div>

          <div className="flex gap-1 mb-4 bg-muted rounded-xl p-1">
            {(["assignments", "members"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {tab === "assignments" ? "📝 " : "👥 "}{tab}
              </button>
            ))}
          </div>

          {activeTab === "assignments" && (
            <div className="space-y-4">
              {isTeacher && (
                <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 hover:shadow-glow transition-all">
                  <Plus className="w-4 h-4" /> Create Assignment
                </button>
              )}

              {showCreate && isTeacher && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={handleCreateAssignment} className="bg-card rounded-2xl border border-border p-6 space-y-4">
                  <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <textarea required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" rows={3} className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="submit" className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90">Publish</button>
                </motion.form>
              )}

              {classData.assignments.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No assignments yet</p>
                </div>
              ) : classData.assignments.map((a) => (
                <div key={a.id} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due: {new Date(a.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {isTeacher ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-muted-foreground font-medium">Student</th>
                            <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                            <th className="text-left py-2 text-muted-foreground font-medium">Time</th>
                            <th className="text-left py-2 text-muted-foreground font-medium">File</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.submissions.map((s) => (
                            <tr key={s.studentId} className="border-b border-border/50">
                              <td className="py-2.5 text-foreground">{s.studentName}</td>
                              <td className="py-2.5">
                                {s.submitted ? (
                                  s.late ? (
                                    <span className="flex items-center gap-1 text-amber-500"><Clock className="w-3 h-3" /> Late</span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> Submitted</span>
                                  )
                                ) : (
                                  <span className="flex items-center gap-1 text-destructive"><XCircle className="w-3 h-3" /> Not Submitted</span>
                                )}
                              </td>
                              <td className="py-2.5 text-muted-foreground">{s.time || "-"}</td>
                              <td className="py-2.5 text-primary text-xs">{s.fileName || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div>
                      {a.submissions.find((s) => s.studentId === user.id)?.submitted ? (
                        <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Submitted</p>
                      ) : (
                        <button onClick={() => handleSubmit(a.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                          <Upload className="w-4 h-4" /> Submit Assignment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "members" && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Joined</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {classData.members.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">{m.name}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${m.role === "teacher" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>{m.role}</span></td>
                      <td className="py-3 px-4 text-muted-foreground">{m.joinedAt}</td>
                      <td className="py-3 px-4 text-muted-foreground">{m.submissionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Classroom;
