import React, { createContext, useContext, useState } from "react";

const ClassContext = createContext(undefined);

const generateCode = () => Math.random().toString(36).substr(2, 8).toUpperCase();

const dummyMembers = [
  { id: "s1", name: "Rahul Sharma", role: "student", online: true, joinedAt: "2026-02-01", submissionCount: 3 },
  { id: "s2", name: "Aditi Verma", role: "student", online: false, joinedAt: "2026-02-02", submissionCount: 1 },
  { id: "s3", name: "Priya Patel", role: "student", online: true, joinedAt: "2026-02-03", submissionCount: 2 },
];

export const ClassProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);

  const createClass = (name, description, creatorId, creatorName) => {
    const newClass = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      inviteCode: generateCode(),
      creatorId,
      members: [
        { id: creatorId, name: creatorName, role: "teacher", online: true, joinedAt: new Date().toISOString().split("T")[0], submissionCount: 0 },
        ...dummyMembers,
      ],
      messages: [
        { id: "m1", sender: creatorName, role: "teacher", content: `Welcome to ${name}! 🎓`, time: new Date().toLocaleTimeString(), isNotice: true },
      ],
      assignments: [],
    };
    setClasses((prev) => [...prev, newClass]);
    return newClass;
  };

  const joinClass = (inviteCode, userId, userName) => {
    let found = null;
    setClasses((prev) =>
      prev.map((c) => {
        if (c.inviteCode === inviteCode && !c.members.find((m) => m.id === userId)) {
          const updated = {
            ...c,
            members: [...c.members, { id: userId, name: userName, role: "student", online: true, joinedAt: new Date().toISOString().split("T")[0], submissionCount: 0 }],
          };
          found = updated;
          return updated;
        }
        if (c.inviteCode === inviteCode) found = c;
        return c;
      })
    );
    return found;
  };

  const getClass = (id) => classes.find((c) => c.id === id);

  const addMessage = (classId, msg) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, messages: [...c.messages, { ...msg, id: Math.random().toString(36).substr(2, 9) }] } : c
      )
    );
  };

  const togglePin = (classId, msgId) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, isPinned: !m.isPinned } : m)) }
          : c
      )
    );
  };

  const addAssignment = (classId, assignment) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const subs = c.members.filter((m) => m.role === "student").map((m) => ({ studentId: m.id, studentName: m.name, submitted: false }));
        return {
          ...c,
          assignments: [...c.assignments, { ...assignment, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), submissions: subs }],
        };
      })
    );
  };

  const submitAssignment = (classId, assignmentId, studentId, studentName, fileName) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          assignments: c.assignments.map((a) => {
            if (a.id !== assignmentId) return a;
            const isLate = new Date() > new Date(a.dueDate);
            return {
              ...a,
              submissions: a.submissions.map((s) =>
                s.studentId === studentId ? { ...s, submitted: true, time: new Date().toLocaleTimeString(), fileName, late: isLate } : s
              ),
            };
          }),
        };
      })
    );
  };

  return (
    <ClassContext.Provider value={{ classes, createClass, joinClass, getClass, addMessage, togglePin, addAssignment, submitAssignment }}>
      {children}
    </ClassContext.Provider>
  );
};

export const useClasses = () => {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error("useClasses must be used within ClassProvider");
  return ctx;
};
