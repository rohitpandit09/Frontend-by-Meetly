import React, { createContext, useContext, useState } from "react";

const ClassContext = createContext(undefined);

const generateCode = () => Math.random().toString(36).substr(2, 8).toUpperCase();


export const ClassProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);

  const createClass = async (name, description, creatorId, creatorName) => {
    try {
      const res = await fetch("https://backend-by-meetly.onrender.com/api/class/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          teacherId: creatorId,
          teacherName: creatorName
        })
      });

      const data = await res.json();

      console.log("FRONTEND RESPONSE:", data); // 🔥 DEBUG

      if (!res.ok) throw new Error(data.message);

      return {
        id: data.class._id,
        name: data.class.name,
        description: data.class.description,
        inviteCode: data.class.classCode
      };

    } catch (err) {
      console.error("Create class error:", err);
      return null;
    }
  };

  const joinClass = async (inviteCode, userId, userName) => {
  try {
    const res = await fetch("https://backend-by-meetly.onrender.com/api/class/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        classCode: inviteCode,
        userId
      })
    });

    const data = await res.json();

    console.log("JOIN RESPONSE:", data);

    if (!res.ok) throw new Error(data.message);

    return {
      id: data.class._id,
      name: data.class.name,
      description: data.class.description,
      inviteCode: data.class.classCode
    };

  } catch (err) {
    console.log("JOIN ERROR:", err);
    return null;
  }
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
