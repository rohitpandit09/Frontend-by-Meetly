import { useState, useEffect,useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, VideoOff, Mic, MicOff, Phone, MonitorUp, MessageSquare, Hand,
  MoreVertical, ChevronLeft, ChevronRight, Users, Timer, Bot, ClipboardList, FileText, Maximize
} from "lucide-react";
import { socket } from "@/sockets/socket";


const Meeting = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("chat");
  const [elapsed, setElapsed] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [handRaised, setHandRaised] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [shareScreenActive, setShareScreenActive] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [polls, setPolls] = useState([]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(30);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [votedPolls, setVotedPolls] = useState({});
  const [activeScreenUser, setActiveScreenUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [testQuestions, setTestQuestions] = useState([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  const [testTimeLimit, setTestTimeLimit] = useState(10);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testTimeRemaining, setTestTimeRemaining] = useState(0);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState(null);
  const [takingTest, setTakingTest] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const remoteStreamsRef = useRef([]);
  const localVideoRef = useRef();
  const mainVideoRef = useRef();
  const joinedRoom = useRef(false);
  const peerConnections = useRef({});
  const remoteVideoRefs = useRef({});
  const screenSenders = useRef({});
  const userId = user?.id || user?._id;

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (takingTest) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'You are currently taking a test. Are you sure you want to leave?';
        return e.returnValue;
      };

      const handlePopState = (e) => {
        if (takingTest) {
          const confirmLeave = window.confirm('You are currently taking a test. Are you sure you want to leave?');
          if (!confirmLeave) {
            window.history.pushState(null, '', window.location.pathname);
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [takingTest]);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        setLocalStream(stream);
      } catch (err) {
        console.log("MEDIA ERROR:", err);
      }
    };

    startMedia();
  }, []);

  useEffect(() => {
    remoteStreamsRef.current = remoteStreams;
    if (!mainVideoRef.current) return;
    
    console.log(`Video sync effect triggered. Remote streams: ${remoteStreams.length}, Active: ${activeStreamId}`);
    remoteStreams.forEach(rs => {
      console.log(`  - Stream: ${rs.stream.id}, socketId: ${rs.socketId}, kind: ${rs.kind}, tracks: ${rs.stream.getTracks().map(t => t.kind).join(',')}`);
    });
    
    const remoteScreen = remoteStreams.find((item) => item.kind === "screen");
    
    if (shareScreenActive && screenStream) {
      console.log("Setting main video to screen share stream");
      mainVideoRef.current.srcObject = screenStream;
      return;
    }
    
    if (remoteScreen) {
      console.log(`Setting main video to remote screen: ${remoteScreen.stream.id}`);
      mainVideoRef.current.srcObject = remoteScreen.stream;
      return;
    }
    
    if (!localStream) {
      console.log("No local stream available");
      return;
    }
    
    if (localVideoRef.current && remoteStreams.length > 0) {
      console.log("Setting local video preview");
      localVideoRef.current.srcObject = localStream;
    }
    
    if (!activeStreamId && !remoteStreams.length) {
      console.log("No active stream, showing local video");
      mainVideoRef.current.srcObject = localStream;
      return;
    }

    const active = remoteStreams.find((item) => item.socketId === activeStreamId && item.kind === "camera") 
      || remoteStreams.find((item) => item.socketId === activeStreamId) 
      || remoteStreams[0];
    
    if (active) {
      console.log(`Setting main video to active stream: ${active.stream.id} (socketId: ${active.socketId}, kind: ${active.kind})`);
      mainVideoRef.current.srcObject = active.stream;
      console.log(`  Tracks on stream: ${active.stream.getTracks().map(t => `${t.kind}(${t.enabled})`).join(',')}`);
    } else {
      console.log("No active stream, showing local video");
      mainVideoRef.current.srcObject = localStream;
    }
  }, [localStream, remoteStreams, activeStreamId, shareScreenActive, screenStream]);

  useEffect(() => {
    const remoteScreen = remoteStreams.find((item) => item.kind === "screen");
    setActiveScreenUser(remoteScreen?.user || null);
  }, [remoteStreams]);

  useEffect(() => {
    const checkMeeting = async () => {
      const res = await fetch(`https://backend-by-meetly.onrender.com/api/class/${id}`);
      const data = await res.json();

      if (!data.class?.isMeetingStarted) {
        navigate(`/class/${id}`);
      }
    };

    if (id) checkMeeting();
  }, [id, navigate]);

  const addRemoteStream = (socketId, stream, userInfo, kind = "camera") => {
    console.log(`addRemoteStream called: socketId=${socketId}, streamId=${stream.id}, kind=${kind}`);
    
    setRemoteStreams((prev) => {
      // Check if this exact stream already exists
      const exists = prev.some(
        (item) => item.socketId === socketId && item.stream.id === stream.id && item.kind === kind
      );
      
      if (exists) {
        console.log(`Stream already exists, skipping duplicate: ${stream.id}`);
        return prev;
      }

      // For camera streams, check if we already have a camera stream from this user
      if (kind === "camera") {
        const existingCamera = prev.find(
          (item) => item.socketId === socketId && item.kind === "camera"
        );
        
        // If a camera stream already exists and it's different, replace it
        if (existingCamera && existingCamera.stream.id !== stream.id) {
          console.log(`Replacing existing camera stream for ${socketId}`);
          return prev.map((item) =>
            item.socketId === socketId && item.kind === "camera"
              ? { socketId, stream, user: userInfo, kind }
              : item
          );
        }
      }

      console.log(`Adding new stream: socketId=${socketId}, kind=${kind}`);
      const newState = [...prev, { socketId, stream, user: userInfo, kind }];
      remoteStreamsRef.current = newState;
      
      // Set initial active stream if not set and this is a camera
      if (!window.activeStreamIdSet && kind === "camera") {
        setActiveStreamId(socketId);
        setActiveParticipant(userInfo);
        window.activeStreamIdSet = true;
      }
      
      return newState;
    });
  };

const addScreenTrackToPeers = (screenTrack, displayStream) => {
      Object.entries(peerConnections.current).forEach(([socketId, pc]) => {
        const sender = pc.addTrack(screenTrack, displayStream);
        screenSenders.current[socketId] = sender;
      });
    };

    const renegotiatePeers = async () => {
      await Promise.all(
        Object.entries(peerConnections.current).map(async ([socketId, pc]) => {
          if (pc.signalingState !== "stable") return;
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("send_offer", {
              offer,
              to: socketId,
              user: { id: userId, name: user?.name, role: user?.role }
            });
          } catch (err) {
            console.error("renegotiate error", err);
          }
        })
      );
    };

    const removeScreenTrackFromPeers = async () => {
      Object.entries(screenSenders.current).forEach(([socketId, sender]) => {
        const pc = peerConnections.current[socketId];
        if (pc && sender) {
          try {
            pc.removeTrack(sender);
          } catch (err) {
            console.error("removeTrack error", err);
          }
        }
      });
      screenSenders.current = {};
      await renegotiatePeers();
    };

    const stopScreenShare = async () => {
      if (!screenStream) return;
      await removeScreenTrackFromPeers();
      screenStream.getTracks().forEach((t) => t.stop());
      setShareScreenActive(false);
      setScreenStream(null);
    };

    const toggleScreenShare = async () => {
      if (shareScreenActive) {
        await stopScreenShare();
        return;
      }

      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) return;

        screenTrack.addEventListener("ended", async () => {
          await stopScreenShare();
        });

        setScreenStream(displayStream);
        setShareScreenActive(true);
        addScreenTrackToPeers(screenTrack, displayStream);
        await renegotiatePeers();
        if (mainVideoRef.current) {
          mainVideoRef.current.srcObject = displayStream;
        }
      } catch (err) {
        console.error("Screen share failed", err);
      }
    };

  const createPollId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!pollQuestion.trim() || pollOptions.filter((text) => text.trim()).length < 2) return;
    const pollId = createPollId();
    const poll = {
      id: pollId,
      question: pollQuestion,
      options: pollOptions.filter((text) => text.trim()).map((text) => ({ text: text.trim(), votes: 0 })),
      duration: Number(pollDuration),
      status: "open",
      totalVotes: 0,
      creator: user?.name || "Host",
      creatorId: userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + Number(pollDuration) * 1000,
      votes: {}
    };

    socket.emit("create_poll", { classId: id, poll });
    // Don't add immediately - let the socket event handler add it to ensure consistency
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollDuration(30);
  };

  const handlePollCardClick = (poll) => {
    setSelectedPoll(poll);
    setSelectedOption(poll.votes?.[userId] ?? null);
  };

  const handleSubmitPollVote = async () => {
    if (!selectedPoll || selectedOption == null) return;
    socket.emit("submit_poll_vote", {
      classId: id,
      pollId: selectedPoll.id,
      optionIndex: selectedOption,
      user: { id: userId, name: user?.name }
    });
    setVotedPolls((prev) => ({ ...prev, [selectedPoll.id]: selectedOption }));
    setPolls((prev) => prev.map((poll) => {
      if (poll.id !== selectedPoll.id) return poll;
      const previousVote = poll.votes?.[userId];
      const updatedOptions = poll.options.map((option, index) => {
        if (previousVote === index) {
          return { ...option, votes: Math.max(0, option.votes - 1) };
        }
        if (index === selectedOption) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      });
      return {
        ...poll,
        votes: { ...poll.votes, [userId]: selectedOption },
        totalVotes: poll.totalVotes + (previousVote != null ? 0 : 1),
        options: updatedOptions
      };
    }));
    closePollModal();
  };

  const closePollModal = () => {
    setSelectedPoll(null);
    setSelectedOption(null);
  };

  useEffect(() => {
    if (!selectedPoll) return;
    const updated = polls.find((poll) => poll.id === selectedPoll.id);
    if (updated && updated !== selectedPoll) {
      setSelectedPoll(updated);
    }
  }, [polls, selectedPoll]);

  const updatePollOption = (index, value) => {
    setPollOptions((prev) => prev.map((text, idx) => (idx === index ? value : text)));
  };

  const addPollOption = () => {
    setPollOptions((prev) => [...prev, ""]);
  };

  const removePollOption = (index) => {
    setPollOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const createTestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const handleCreateTest = (e) => {
    e.preventDefault();
    if (!testQuestions.some(q => q.question.trim())) return;
    const testId = createTestId();
    const test = {
      id: testId,
      questions: testQuestions.filter(q => q.question.trim()),
      timeLimit: Number(testTimeLimit),
      status: "published",
      creator: user?.name || "Host",
      creatorId: userId,
      createdAt: Date.now(),
      submissions: {}
    };

    socket.emit("create_test", { classId: id, test });
    // Don't add immediately - let the socket event handler add it to ensure consistency
    setTestQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
    setTestTimeLimit(10);
  };

  const handleStartTest = (test) => {
    setSelectedTest(test);
    setTestAnswers({});
    setTestTimeRemaining(test.timeLimit * 60);
    setTestSubmitted(false);
    setTestScore(null);
    setTakingTest(true);
    setTestStartTime(Date.now());
  };

  const handleViewTestResult = (test) => {
    const userSubmission = test.submissions?.[userId];
    if (!userSubmission) return;
    
    setSelectedTest(test);
    setTestAnswers(userSubmission.answers || {});
    setTestScore(userSubmission.score);
    setTestSubmitted(true);
    setTakingTest(false);
    setTestTimeRemaining(0);
    setTestStartTime(null);
  };

  const handleTestAnswerChange = (questionIndex, answerIndex) => {
    setTestAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmitTest = () => {
    if (!selectedTest) return;
    const score = selectedTest.questions.reduce((total, question, index) => {
      return total + (testAnswers[index] === question.correct ? 1 : 0);
    }, 0);

    const submission = {
      testId: selectedTest.id,
      userId,
      userName: user?.name || "Student",
      answers: testAnswers,
      score,
      totalQuestions: selectedTest.questions.length,
      submittedAt: Date.now(),
      timeTaken: Math.floor((Date.now() - testStartTime) / 1000)
    };

    socket.emit("submit_test", { classId: id, submission });
    setTestScore(score);
    setTestSubmitted(true);
    setTakingTest(false);
  };

  const closeTestModal = () => {
    if (takingTest && !testSubmitted) {
      const confirmClose = window.confirm('You are currently taking a test. Closing will submit your current answers. Are you sure?');
      if (confirmClose) {
        handleSubmitTest();
      }
      return;
    }
    setSelectedTest(null);
    setTestAnswers({});
    setTestTimeRemaining(0);
    setTestSubmitted(false);
    setTestScore(null);
    setTakingTest(false);
    setTestStartTime(null);
  };

  const updateTestQuestion = (index, field, value) => {
    setTestQuestions(prev => prev.map((q, idx) => idx === index ? { ...q, [field]: value } : q));
  };

  const updateTestOption = (questionIndex, optionIndex, value) => {
    setTestQuestions(prev => prev.map((q, idx) => idx === questionIndex ? {
      ...q,
      options: q.options.map((opt, j) => j === optionIndex ? value : opt)
    } : q));
  };

  const addTestQuestion = () => {
    setTestQuestions(prev => [...prev, { question: "", options: ["", "", "", ""], correct: 0 }]);
  };

  const removeTestQuestion = (index) => {
    setTestQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const removeRemoteStream = (socketId) => {
    setRemoteStreams((prev) => prev.filter((item) => item.socketId !== socketId));
    setActiveStreamId((current) => (current === socketId ? null : current));
  };

  const handleSendAiQuestion = async (e) => {
    e?.preventDefault();
    if (!aiInput.trim()) return;

    const userMessage = {
      role: "user",
      content: aiInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setAiInput("");
    setAiLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (apiKey && apiKey !== "your_groq_api_key_here") {
        // Call the real Groq API
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mixtral-8x7b-32768",
            messages: [
              {
                role: "system",
                content: "You are a helpful AI assistant in an online classroom. Provide clear, concise, and educational answers to student questions. Keep responses under 500 words."
              },
              ...aiMessages.map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              {
                role: "user",
                content: userMessage.content
              }
            ],
            max_tokens: 1024,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || "I couldn't process that question. Please try again.";

        const aiMessage = {
          role: "assistant",
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setAiMessages((prev) => [...prev, aiMessage]);
      } else {
        // Use intelligent mock responses
        const mockResponses = {
          "hello": "Hello! I'm your AI classroom assistant. How can I help you today?",
          "hi": "Hey there! Feel free to ask me questions about any topic covered in class.",
          "help": "I'm here to help! You can ask me about:\n• Course topics and concepts\n• Study tips and learning strategies\n• Definitions and explanations\n• Problem-solving approaches\n\nWhat would you like to learn about?",
          "test": "About tests and exams:\n• Prepare by reviewing class materials regularly\n• Practice with sample questions\n• Focus on understanding concepts, not just memorization\n• Get plenty of rest before exam day\n• Ask your teacher for clarification on difficult topics\n\nWould you like help with a specific topic?",
          "study": "Study tips:\n1. Create a study schedule and stick to it\n2. Break content into manageable chunks\n3. Use active recall - test yourself\n4. Take breaks every 25-30 minutes\n5. Form study groups with classmates\n6. Teach others what you've learned\n7. Use multiple resources (textbooks, videos, practice problems)\n\nWhat subject would you like help studying?",
          "math": "Mathematics is all about practice and understanding concepts. Here are key tips:\n• Work through problems step-by-step\n• Understand WHY solutions work, not just HOW\n• Practice similar problems repeatedly\n• Review your mistakes carefully\n• Don't hesitate to ask for help\n\nWhat math topic would you like help with?",
          "science": "Science learning tips:\n• Understand the scientific method\n• Connect theory to real-world examples\n• Use diagrams and visual aids\n• Conduct experiments when possible\n• Review lab reports and results\n• Stay curious and ask questions!\n\nWhich science topic interests you?",
          "writing": "Writing skills development:\n• Start with an outline\n• Write a clear thesis statement\n• Support your ideas with evidence\n• Revise and edit multiple times\n• Read your work aloud\n• Get feedback from others\n• Study examples of good writing\n\nWhat type of writing are you working on?"
        };

        const lowerInput = userMessage.content.toLowerCase();
        let response = mockResponses["hello"];

        for (const [key, value] of Object.entries(mockResponses)) {
          if (lowerInput.includes(key)) {
            response = value;
            break;
          }
        }

        if (!Object.keys(mockResponses).some(key => lowerInput.includes(key))) {
          // Generate a smart generic response based on keywords
          response = `Great question about "${userMessage.content}"!\n\nHere are some key points to consider:\n\n1. **Understand the Basics**: Make sure you have a solid foundation of the core concepts.\n\n2. **Break It Down**: Divide complex topics into smaller, manageable parts.\n\n3. **Use Resources**: Consult your textbook, class notes, and supplementary materials.\n\n4. **Practice**: Work through problems and examples related to this topic.\n\n5. **Ask for Help**: Don't hesitate to reach out to your teacher or classmates if you need clarification.\n\nWould you like me to explain any specific part in more detail, or do you have a follow-up question?`;
        }

        const aiMessage = {
          role: "assistant",
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setAiMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error("AI error:", err);
      
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an issue processing your question. Please try again or rephrase your question.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setAiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  const closePeer = (socketId) => {
    if (peerConnections.current[socketId]) {
      peerConnections.current[socketId].close();
      delete peerConnections.current[socketId];
    }
    delete remoteVideoRefs.current[socketId];
  };

  const createPeerConnection = (socketId, userInfo) => {
    console.log(`Creating peer connection for ${socketId}`);
    if (peerConnections.current[socketId]) {
      console.log(`Peer connection already exists for ${socketId}`);
      return peerConnections.current[socketId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" }
      ]
    });

    let isNegotiating = false;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`ICE candidate from ${socketId}`);
        socket.emit("ice_candidate", { to: socketId, candidate: event.candidate });
      }
    };

    pc.onnegotiationneeded = async () => {
      if (isNegotiating) {
        console.log(`Skipping negotiation - already negotiating for ${socketId}`);
        return;
      }
      isNegotiating = true;

      try {
        console.log(`Creating offer for ${socketId}`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("send_offer", { offer, to: socketId, user: { id: userId, name: user?.name, role: user?.role } });
      } catch (err) {
        console.error("negotiationneeded error", err);
      } finally {
        isNegotiating = false;
      }
    };

    pc.ontrack = (event) => {
      console.log("Received track:", event.track.kind, "from", socketId, "enabled:", event.track.enabled);
      
      // Get or create stream
      let stream = event.streams?.[0];
      
      if (!stream) {
        // No stream in event, create one
        console.log(`No stream in event, creating new MediaStream for ${event.track.kind}`);
        stream = new MediaStream([event.track]);
      } else {
        // Stream exists in event, ensure track is added
        if (!stream.getTracks().includes(event.track)) {
          try {
            stream.addTrack(event.track);
            console.log(`Added ${event.track.kind} track to existing stream: ${stream.id}`);
          } catch (err) {
            console.warn(`Failed to add track to stream:`, err);
          }
        }
      }

      // Determine if this is screen share or camera
      let kind = "camera";
      
      const trackConstraints = event.track.getConstraints?.();
      if (trackConstraints?.displaySurface) {
        kind = "screen";
      } else {
        // Check if we already have a camera stream from this peer with a different stream ID
        const existingRemoteStreams = remoteStreamsRef.current.filter(item => item.socketId === socketId);
        const hasCameraStream = existingRemoteStreams.some(
          item => item.kind === "camera"
        );
        
        // If this is a video track and we already have a camera stream, it's likely screen share
        if (event.track.kind === "video" && hasCameraStream && existingRemoteStreams.length > 0) {
          const cameraStream = existingRemoteStreams.find(item => item.kind === "camera");
          // Different stream ID suggests screen share
          if (cameraStream && stream.id !== cameraStream.stream.id) {
            kind = "screen";
            console.log(`Detected screen share - different stream ID (${stream.id} vs ${cameraStream.stream.id})`);
          }
        }
      }

      console.log(`Track handler: Adding ${kind} stream from ${socketId}: ${stream.id}, tracks count: ${stream.getTracks().length}`);
      addRemoteStream(socketId, stream, userInfo, kind);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${socketId}:`, pc.connectionState);
      if (pc.connectionState === "failed") {
        console.error(`Connection failed for ${socketId}`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${socketId}:`, pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log(`ICE gathering state for ${socketId}:`, pc.iceGatheringState);
    };

    // Add local tracks if available
    if (localStream && localStream.getTracks && localStream.getTracks().length > 0) {
      console.log(`Adding ${localStream.getTracks().length} local tracks to ${socketId}`);
      localStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStream);
          console.log(`Added ${track.kind} track to ${socketId}`);
        } catch (err) {
          console.error(`Error adding ${track.kind} track:`, err);
        }
      });
    } else {
      console.warn(`No local stream available for ${socketId}`);
    }

    peerConnections.current[socketId] = pc;
    console.log(`Peer connection created for ${socketId}`);
    return pc;
  };

  const handleReceiveOffer = async ({ offer, from, user: sender }) => {
    if (!localStream) return;
    const participant = participants.find((p) => p.socketId === from) || { socketId: from, name: sender?.name || "Unknown", id: sender?.id || from, role: sender?.role };
    const pc = createPeerConnection(from, participant);
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("send_answer", { answer, to: from, user: { id: userId, name: user?.name, role: user?.role } });
  };

  const handleReceiveAnswer = async ({ answer, from }) => {
    const pc = peerConnections.current[from];
    if (!pc) return;
    await pc.setRemoteDescription(answer);
  };

  const handleReceiveIceCandidate = async ({ candidate, from }) => {
    const pc = peerConnections.current[from];
    if (!pc || !candidate) return;
    try {
      await pc.addIceCandidate(candidate);
    } catch (err) {
      console.error("ICE candidate error", err);
    }
  };

  useEffect(() => {
    if (!user || !id || !localStream || joinedRoom.current) return;
    joinedRoom.current = true;

    const userInfo = {
      id: user.id || user._id,
      name: user.name,
      role: user.role
    };

    socket.emit("join_class", {
      classId: id,
      user: userInfo
    });

    const currentUserId = user.id || user._id;

    const handleOnlineUsers = (users) => {
      setParticipants(users);
      setActiveParticipant((current) => {
        const activeStillExists = current && users.some((u) => u.socketId === current.socketId);
        if (activeStillExists) return current;
        const firstRemote = users.find((u) => u.id !== currentUserId);
        const nextActive = firstRemote || users[0] || null;
        if (nextActive) {
          setActiveStreamId(nextActive.socketId);
        }
        return nextActive;
      });

      const activeIds = users.map((u) => u.socketId);
      Object.keys(peerConnections.current).forEach((socketId) => {
        if (!activeIds.includes(socketId)) {
          closePeer(socketId);
          removeRemoteStream(socketId);
        }
      });
    };

    const handleUserJoined = async ({ socketId, id: peerId, name, role }) => {
      if (!localStream || socketId === socket.id) return;
      const peerUserInfo = { id: peerId, name, role, socketId };
      const pc = createPeerConnection(socketId, peerUserInfo);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("send_offer", { offer, to: socketId, user: { id: userId, name: user?.name, role: user?.role } });
    };

    const handleExistingPolls = (polls) => {
      setPolls(polls || []);
    };

    const updatePollState = (updatedPoll) => {
      setPolls((prev) => {
        const existing = prev.find((poll) => poll.id === updatedPoll.id);
        if (existing) {
          return prev.map((poll) => (poll.id === updatedPoll.id ? { ...poll, ...updatedPoll } : poll));
        }
        return [updatedPoll, ...prev];
      });
    };

    const handlePollCreated = (poll) => {
      updatePollState(poll);
    };

    const handlePollVoteUpdate = ({ pollId, optionVotes, totalVotes, closed }) => {
      setPolls((prev) => prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        const updatedOptions = poll.options.map((option, index) => ({
          ...option,
          votes: optionVotes?.[index] ?? option.votes
        }));
        return {
          ...poll,
          options: updatedOptions,
          totalVotes: totalVotes ?? poll.totalVotes,
          status: closed ? "closed" : poll.status
        };
      }));
    };

    const handleReceiveMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const handleExistingTests = (tests) => {
      setTests(tests || []);
    };

    const handleTestCreated = (test) => {
      setTests((prev) => [test, ...prev]);
    };

    const handleTestSubmitted = ({ testId, submission }) => {
      setTests((prev) => prev.map((test) => {
        if (test.id !== testId) return test;
        return {
          ...test,
          submissions: { ...test.submissions, [submission.userId]: submission }
        };
      }));
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_joined", handleUserJoined);
    socket.on("receive_offer", handleReceiveOffer);
    socket.on("receive_answer", handleReceiveAnswer);
    socket.on("ice_candidate", handleReceiveIceCandidate);
    socket.on("existing_polls", handleExistingPolls);
    socket.on("poll_created", handlePollCreated);
    socket.on("poll_vote_updated", handlePollVoteUpdate);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("existing_tests", handleExistingTests);
    socket.on("test_created", handleTestCreated);
    socket.on("test_submitted", handleTestSubmitted);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_joined", handleUserJoined);
      socket.off("receive_offer", handleReceiveOffer);
      socket.off("receive_answer", handleReceiveAnswer);
      socket.off("ice_candidate", handleReceiveIceCandidate);
      socket.off("existing_polls", handleExistingPolls);
      socket.off("poll_created", handlePollCreated);
      socket.off("poll_vote_updated", handlePollVoteUpdate);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("existing_tests", handleExistingTests);
      socket.off("test_created", handleTestCreated);
      socket.off("test_submitted", handleTestSubmitted);
      Object.keys(peerConnections.current).forEach(closePeer);
      setRemoteStreams([]);
      setPolls([]);
    };
  }, [user, id, localStream, userId]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const chatMessage = {
      classId: id,
      sender: user?.name || "You",
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      userId
    };
    socket.emit("send_message", chatMessage);
    setChatMessages((p) => [...p, chatMessage]);
    setChatInput("");
  };

  const isTeacher = user?.role === "teacher";
  const self = participants.find((p) => p.id === userId);
  const others = participants.filter((p) => p.id !== userId);
  const totalUsers = participants.length;

  const mainParticipant = activeParticipant || others[0] || self || null;

  return (
    <div className="h-screen flex flex-col meeting-bg overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 meeting-surface border-b meeting-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Video className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold meeting-text text-sm">MEETLY</span>
          <span className="text-xs meeting-text opacity-50">Meeting: {id}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full meeting-surface border meeting-border">
            <Timer className="w-3.5 h-3.5 meeting-text opacity-60" />
            <span className="text-sm font-mono meeting-text">{formatTime(elapsed)}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full meeting-surface border meeting-border">
            <Users className="w-3.5 h-3.5 meeting-text opacity-60" />
            <span className="text-sm meeting-text">{participants.length}</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col p-3 gap-3">
          {/* Active speaker */}
          <div className="flex-1 relative rounded-2xl overflow-hidden meeting-surface border meeting-border">
            <video
              ref={mainVideoRef}
              autoPlay
              playsInline
              muted={remoteStreams.length === 0}
              className="w-full h-full object-cover"
            />
            {!localStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Waiting for camera...</p>
                </div>
              </div>
            )}
            {(shareScreenActive || activeScreenUser) && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg glass-dark">
                <MonitorUp className="w-4 h-4 meeting-text" />
                <span className="text-xs meeting-text">
                  {shareScreenActive
                    ? "You are sharing your screen"
                    : `${activeScreenUser?.name || "Someone"} is sharing a screen`}
                </span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg glass-dark">
              <span className="text-sm font-medium meeting-text">{activeParticipant?.name || self?.name || "You"}</span>
            </div>
            <button className="absolute top-4 right-4 p-2 rounded-lg glass-dark meeting-text opacity-60 hover:opacity-100 transition-opacity">
              <Maximize className="w-4 h-4" />
            </button>
            {remoteStreams.length > 0 && (
              <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl meeting-surface border meeting-border overflow-hidden shadow-lg">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-1 left-2 text-[10px] meeting-text bg-black/40 px-1.5 py-0.5 rounded">
                  You
                </div>
              </div>
            )}
          </div>

          {/* Participant strip */}
          {/* Participants Layout */}

          {/* 🔥 CASE: 2 USERS → bottom strip */}
          {totalUsers === 2 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {others.map((p) => {
                const previewStream = remoteStreams.find((item) => item.socketId === p.socketId && item.kind === "camera")?.stream;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveParticipant(p);
                      setActiveStreamId(p.socketId);
                    }}
                    className="flex-shrink-0 w-36 h-24 rounded-xl meeting-surface border meeting-border overflow-hidden"
                  >
                    {previewStream ? (
                      <video
                        ref={(el) => {
                          if (el) el.srcObject = previewStream;
                        }}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl font-bold meeting-text">
                          {p?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 🔥 CASE: 3+ USERS → no extra top-right stack */}
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="meeting-surface border-l meeting-border flex flex-col overflow-hidden"
              style={{ width: 300 }}
            >
              <div className="flex gap-1 p-2 border-b meeting-border flex-shrink-0">
                {["chat", "people", "poll", "ai", "test"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${sidebarTab === tab ? "gradient-primary text-primary-foreground" : "meeting-text opacity-60 hover:opacity-100"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {sidebarTab === "chat" ? (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.length === 0 && <p className="text-center text-xs meeting-text opacity-40 py-8">No messages yet</p>}
                    {chatMessages.map((m, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-semibold meeting-text">{m.sender}</span>
                        <span className="meeting-text opacity-40 ml-2">{m.time}</span>
                        <p className="meeting-text opacity-80 mt-0.5 break-words">{m.text}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChat} className="flex gap-2 p-3 border-t meeting-border flex-shrink-0">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send a message..."
                      className="flex-1 px-3 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none"
                    />
                    <button type="submit" className="px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs">Send</button>
                  </form>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-3">
                  {sidebarTab === "people" && (
                    <div className="space-y-2">
                      {participants.map((p) => (
                        <div
                          key={p.socketId}
                          className="flex items-center gap-2 p-2 rounded-lg meeting-control"
                        >
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {p.name.charAt(0)}
                          </div>

                          <span className="text-xs meeting-text flex-1">
                            {p.name} {p.id === user.id && "(You)"}
                          </span>

                          <span className="text-[10px] text-green-500">●</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sidebarTab === "poll" && (
                    <div className="space-y-4">
                      {isTeacher && (
                        <div className="p-3 rounded-2xl meeting-surface border meeting-border space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-secondary-foreground">Create poll</p>
                              <p className="text-[11px] meeting-text opacity-70">Launch a classroom poll instantly.</p>
                            </div>
                            <button onClick={handleCreatePoll} className="px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs">Launch</button>
                          </div>
                          <input
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            placeholder="Poll question"
                            className="w-full px-3 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none"
                          />
                          <div className="space-y-2">
                            {pollOptions.map((option, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input
                                  value={option}
                                  onChange={(e) => updatePollOption(index, e.target.value)}
                                  placeholder={`Option ${index + 1}`}
                                  className="flex-1 px-3 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none"
                                />
                                {pollOptions.length > 2 && (
                                  <button type="button" onClick={() => removePollOption(index)} className="px-2 py-2 rounded-lg bg-destructive text-primary-foreground text-xs">
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={addPollOption} className="px-3 py-2 rounded-lg meeting-control meeting-control-hover text-xs">Add option</button>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-xs meeting-text opacity-70">Duration</span>
                              <input
                                type="number"
                                value={pollDuration}
                                min={10}
                                max={120}
                                onChange={(e) => setPollDuration(Number(e.target.value))}
                                className="w-20 px-2 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none"
                              />
                              <span className="text-xs meeting-text opacity-70">seconds</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-3">
                        {polls.length === 0 ? (
                          <p className="text-xs meeting-text opacity-40 text-center py-8">No active polls yet</p>
                        ) : (
                          polls.map((poll) => {
                            const isOpen = poll.status !== "closed" && Date.now() < poll.expiresAt;
                            const totalVotes = poll.totalVotes || poll.options.reduce((sum, o) => sum + (o.votes || 0), 0);
                            return (
                              <button
                                key={poll.id}
                                onClick={() => handlePollCardClick(poll)}
                                className="w-full rounded-2xl meeting-surface border meeting-border p-3 text-left hover:ring-2 hover:ring-primary/20"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold meeting-text">{poll.question}</p>
                                    <p className="text-[11px] meeting-text opacity-50">{poll.creator} • {isOpen ? "Open" : "Closed"}</p>
                                  </div>
                                  <div className="text-[11px] meeting-text opacity-60 flex-shrink-0">{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</div>
                                </div>
                                <div className="mt-3 text-[11px] grid gap-1">
                                  {poll.options.slice(0, 2).map((option, index) => {
                                    const pollTotal = poll.options.reduce((sum, o) => sum + (o.votes || 0), 0);
                                    const pct = pollTotal > 0 ? Math.round(((option.votes || 0) / pollTotal) * 100) : 0;
                                    return (
                                      <div key={index} className="flex items-center justify-between">
                                        <span className="truncate">{option.text || "—"}</span>
                                        <span className="text-[11px] opacity-70">{pct}% ({option.votes || 0})</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  {sidebarTab === "ai" && (
                    <div className="flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {aiMessages.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <Bot className="w-12 h-12 meeting-text opacity-30 mb-3" />
                            <p className="text-xs meeting-text opacity-60">Ask me anything about the class or topics you're learning!</p>
                          </div>
                        )}
                        {aiMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                                msg.role === "user"
                                  ? "gradient-primary text-primary-foreground rounded-br-none"
                                  : "meeting-surface border meeting-border rounded-bl-none"
                              }`}
                            >
                              <p className="meeting-text whitespace-pre-wrap break-words">{msg.content}</p>
                              <span className="text-[10px] opacity-60 mt-1 block">{msg.timestamp}</span>
                            </div>
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <form onSubmit={handleSendAiQuestion} className="flex gap-2 p-3 border-t meeting-border flex-shrink-0">
                        <input
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          disabled={aiLoading}
                          placeholder="Ask a question..."
                          className="flex-1 px-3 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={aiLoading || !aiInput.trim()}
                          className="px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs disabled:opacity-50"
                        >
                          {aiLoading ? "..." : "Send"}
                        </button>
                      </form>
                    </div>
                  )}
                  {sidebarTab === "test" && (
                    <div className="space-y-4">
                      {isTeacher && (
                        <div className="p-3 rounded-2xl meeting-surface border meeting-border space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-secondary-foreground">Create test</p>
                              <p className="text-[11px] meeting-text opacity-70">Launch a classroom test instantly.</p>
                            </div>
                            <button onClick={handleCreateTest} className="px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs">Publish</button>
                          </div>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {testQuestions.map((q, qi) => (
                              <div key={qi} className="p-3 rounded-xl meeting-surface border meeting-border space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    value={q.question}
                                    onChange={(e) => updateTestQuestion(qi, "question", e.target.value)}
                                    placeholder={`Question ${qi + 1}`}
                                    className="flex-1 px-3 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none"
                                  />
                                  {testQuestions.length > 1 && (
                                    <button type="button" onClick={() => removeTestQuestion(qi)} className="px-2 py-2 rounded-lg bg-destructive text-primary-foreground text-xs">
                                      ×
                                    </button>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {q.options.map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct-${qi}`}
                                        checked={q.correct === oi}
                                        onChange={() => updateTestQuestion(qi, "correct", oi)}
                                        className="w-3 h-3"
                                      />
                                      <input
                                        value={opt}
                                        onChange={(e) => updateTestOption(qi, oi, e.target.value)}
                                        placeholder={`Option ${oi + 1}`}
                                        className="flex-1 px-3 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={addTestQuestion} className="px-3 py-2 rounded-lg meeting-control meeting-control-hover text-xs">Add question</button>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-xs meeting-text opacity-70">Time limit</span>
                              <input
                                type="number"
                                value={testTimeLimit}
                                min={1}
                                max={60}
                                onChange={(e) => setTestTimeLimit(Number(e.target.value))}
                                className="w-16 px-2 py-2 rounded-lg meeting-control meeting-text text-xs border meeting-border focus:outline-none"
                              />
                              <span className="text-xs meeting-text opacity-70">minutes</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-3">
                        {tests.length === 0 ? (
                          <p className="text-xs meeting-text opacity-40 text-center py-8">No active tests</p>
                        ) : (
                          tests.map((test) => {
                            const userSubmission = test.submissions?.[userId];
                            const hasSubmitted = !!userSubmission;
                            return (
                              <button
                                key={test.id}
                                onClick={() => hasSubmitted ? handleViewTestResult(test) : handleStartTest(test)}
                                className="w-full rounded-2xl meeting-surface border meeting-border p-3 text-left hover:ring-2 hover:ring-primary/20"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold meeting-text">{test.questions.length} Questions</p>
                                    <p className="text-[11px] meeting-text opacity-50">{test.creator} • {test.timeLimit} min</p>
                                  </div>
                                  <div className="text-xs px-2 py-1 rounded-full gradient-primary text-primary-foreground">
                                    {hasSubmitted ? "View Result" : "Start Test"}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="h-20 meeting-surface border-t meeting-border flex items-center justify-center gap-3 px-4 relative">
        <button onClick={() => {
          if (!localStream) return;
          const audioTrack = localStream.getAudioTracks()[0];
          if (!audioTrack) return;
          audioTrack.enabled = !audioOn;
          setAudioOn(!audioOn);
        }} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${audioOn ? "meeting-control meeting-control-hover" : "bg-destructive"}`}>
          {audioOn ? <Mic className="w-5 h-5 meeting-text" /> : <MicOff className="w-5 h-5 text-primary-foreground" />}
        </button>
        <button onClick={() => {
          if (!localStream) return;
          const videoTrack = localStream.getVideoTracks()[0];
          if (!videoTrack) return;
          videoTrack.enabled = !videoOn;
          setVideoOn(!videoOn);
        }} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoOn ? "meeting-control meeting-control-hover" : "bg-destructive"}`}>
          {videoOn ? <Video className="w-5 h-5 meeting-text" /> : <VideoOff className="w-5 h-5 text-primary-foreground" />}
        </button>
        <button onClick={toggleScreenShare} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${shareScreenActive ? "bg-accent" : "meeting-control meeting-control-hover"}`}>
          <MonitorUp className="w-5 h-5 meeting-text" />
        </button>
        <button onClick={() => setHandRaised(!handRaised)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${handRaised ? "bg-accent" : "meeting-control meeting-control-hover"}`}>
          <Hand className="w-5 h-5 meeting-text" />
        </button>
        <button className="w-12 h-12 rounded-full meeting-control meeting-control-hover flex items-center justify-center" onClick={() => { setSidebarOpen(!sidebarOpen); setSidebarTab("chat"); }}>
          <MessageSquare className="w-5 h-5 meeting-text" />
        </button>
        <button className="w-12 h-12 rounded-full meeting-control meeting-control-hover flex items-center justify-center" onClick={() => { setSidebarOpen(!sidebarOpen); setSidebarTab("people"); }}>
          <Users className="w-5 h-5 meeting-text" />
        </button>
        <button className="w-12 h-12 rounded-full meeting-control meeting-control-hover flex items-center justify-center">
          <MoreVertical className="w-5 h-5 meeting-text" />
        </button>
        <button onClick={() => navigate("/")} className="w-14 h-12 rounded-full bg-destructive flex items-center justify-center hover:opacity-90 transition-all ml-4">
          <Phone className="w-5 h-5 text-primary-foreground rotate-[135deg]" />
        </button>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg meeting-control meeting-control-hover">
          {sidebarOpen ? <ChevronRight className="w-4 h-4 meeting-text" /> : <ChevronLeft className="w-4 h-4 meeting-text" />}
        </button>
      </div>

      <AnimatePresence>
        {selectedPoll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-md rounded-3xl meeting-surface border meeting-border p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold meeting-text">{selectedPoll.question}</p>
                  <p className="text-[11px] meeting-text opacity-60">{selectedPoll.creator} • {selectedPoll.status === "closed" || Date.now() >= selectedPoll.expiresAt ? "Closed" : "Open"}</p>
                </div>
                <button onClick={closePollModal} className="text-xs px-2 py-1 rounded-lg meeting-control meeting-text">Close</button>
              </div>
              <div className="space-y-3">
                {selectedPoll.status !== "closed" && Date.now() < selectedPoll.expiresAt ? (
                  <>
                    <div className="text-[11px] meeting-text opacity-60">Select an option and submit your vote.</div>
                    <div className="space-y-2">
                      {selectedPoll.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedOption(index)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border ${selectedOption === index ? "border-primary bg-primary/10" : "border-transparent meeting-surface"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm meeting-text">{option.text}</span>
                            {selectedOption === index && <span className="text-[11px] text-primary">Selected</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSubmitPollVote}
                      className="w-full px-4 py-3 rounded-2xl gradient-primary text-primary-foreground text-sm"
                    >
                      Submit Vote
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-[11px] meeting-text opacity-60">Poll has ended. Results are shown below.</div>
                    <div className="space-y-2 mt-3">
                      {selectedPoll.options.map((option, index) => {
                        const totalVotes = selectedPoll.options.reduce((sum, o) => sum + (o.votes || 0), 0);
                        const pct = totalVotes > 0 ? Math.round(((option.votes || 0) / totalVotes) * 100) : 0;
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between text-xs meeting-text">
                              <span>{option.text}</span>
                              <span className="font-semibold">{pct}% ({option.votes || 0})</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl h-full max-h-[90vh] rounded-3xl meeting-surface border meeting-border overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b meeting-border flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold meeting-text">Test</h2>
                  <p className="text-sm meeting-text opacity-60">{selectedTest.questions.length} questions • {selectedTest.timeLimit} minutes</p>
                </div>
                <div className="flex items-center gap-4">
                  {takingTest && (
                    <>
                      <div className="text-right">
                        <p className="text-sm font-mono meeting-text">
                          {Math.floor(testTimeRemaining / 60)}:{(testTimeRemaining % 60).toString().padStart(2, '0')}
                        </p>
                        <p className="text-xs meeting-text opacity-60">Time remaining</p>
                      </div>
                      <div className="w-32">
                        <div className="flex justify-between text-xs meeting-text opacity-60 mb-1">
                          <span>Progress</span>
                          <span>{Object.keys(testAnswers).length}/{selectedTest.questions.length}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(Object.keys(testAnswers).length / selectedTest.questions.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <button onClick={closeTestModal} className="text-sm px-3 py-1 rounded-lg meeting-control meeting-text">Close</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {testSubmitted && !takingTest ? (
                  <div className="space-y-6">
                    <div className="text-center space-y-4 mb-8 pb-6 border-b meeting-border">
                      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
                        <span className="text-2xl">✓</span>
                      </div>
                      <h3 className="text-xl font-bold meeting-text">Test Completed!</h3>
                      <p className="text-lg meeting-text">Your Score: {testScore}/{selectedTest.questions.length}</p>
                      <p className="text-sm meeting-text opacity-60">
                        {Math.round((testScore / selectedTest.questions.length) * 100)}% correct
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold meeting-text">Review Your Answers</h4>
                      {selectedTest.questions.map((question, qIndex) => {
                        const userAnswer = testAnswers[qIndex];
                        const isCorrect = userAnswer === question.correct;
                        return (
                          <div 
                            key={qIndex} 
                            className={`p-4 rounded-2xl border ${isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                {isCorrect ? '✓' : '✗'}
                              </div>
                              <h5 className="text-sm font-semibold meeting-text flex-1">
                                {qIndex + 1}. {question.question}
                              </h5>
                            </div>
                            <div className="ml-9 space-y-2">
                              {question.options.map((option, oIndex) => {
                                const selected = userAnswer === oIndex;
                                const correct = oIndex === question.correct;
                                return (
                                  <div 
                                    key={oIndex}
                                    className={`p-2 rounded-lg text-sm ${
                                      correct 
                                        ? 'bg-green-500/20 meeting-text font-semibold' 
                                        : selected && !isCorrect 
                                        ? 'bg-red-500/20 meeting-text' 
                                        : 'meeting-text opacity-60'
                                    }`}
                                  >
                                    {option}
                                    {correct && <span className="ml-2 text-green-500">✓ Correct</span>}
                                    {selected && !isCorrect && <span className="ml-2 text-red-500">✗ Your answer</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : testSubmitted ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
                      <span className="text-2xl">✓</span>
                    </div>
                    <h3 className="text-xl font-bold meeting-text">Test Submitted!</h3>
                    <p className="text-lg meeting-text">Your Score: {testScore}/{selectedTest.questions.length}</p>
                    <p className="text-sm meeting-text opacity-60">
                      {Math.round((testScore / selectedTest.questions.length) * 100)}% correct
                    </p>
                  </div>
                ) : takingTest ? (
                  <div className="space-y-6">
                    {selectedTest.questions.map((question, qIndex) => (
                      <div key={qIndex} className="p-4 rounded-2xl meeting-surface border meeting-border">
                        <h4 className="text-lg font-semibold meeting-text mb-4">
                          {qIndex + 1}. {question.question}
                        </h4>
                        <div className="space-y-3">
                          {question.options.map((option, oIndex) => (
                            <label key={oIndex} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                value={oIndex}
                                checked={testAnswers[qIndex] === oIndex}
                                onChange={() => handleTestAnswerChange(qIndex, oIndex)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm meeting-text">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={handleSubmitTest}
                        className="px-8 py-3 rounded-2xl gradient-primary text-primary-foreground text-lg font-semibold"
                      >
                        Submit Test
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto">
                      <FileText className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold meeting-text mb-2">Ready to Start Test?</h3>
                      <p className="text-sm meeting-text opacity-60 mb-6">
                        You have {selectedTest.timeLimit} minutes to complete this test. Once started, you cannot leave until time runs out or you submit.
                      </p>
                      <button
                        onClick={() => handleStartTest(selectedTest)}
                        className="px-8 py-4 rounded-2xl gradient-primary text-primary-foreground text-lg font-semibold"
                      >
                        Start Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Meeting;
