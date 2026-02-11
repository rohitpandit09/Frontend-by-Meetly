import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClassProvider } from "@/contexts/ClassContext";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Profile from "@/pages/Profile";
import CreateClass from "@/pages/CreateClass";
import ClassChat from "@/pages/ClassChat";
import Classroom from "@/pages/Classroom";
import Meeting from "@/pages/Meeting";
import PollCreate from "@/pages/PollCreate";
import AIChat from "@/pages/AIChat";
import TestCreate from "@/pages/TestCreate";
import TestAttempt from "@/pages/TestAttempt";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) => (
  <>
    {showNav && <Navbar />}
    {children}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ClassProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout><Landing /></AppLayout>} />
              <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
              <Route path="/signup" element={<AppLayout><Signup /></AppLayout>} />
              <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
              <Route path="/create-class" element={<AppLayout><CreateClass /></AppLayout>} />
              <Route path="/class/:id" element={<AppLayout><ClassChat /></AppLayout>} />
              <Route path="/classroom/:id" element={<AppLayout><Classroom /></AppLayout>} />
              <Route path="/meeting/:id" element={<Meeting />} />
              <Route path="/poll-create" element={<AppLayout><PollCreate /></AppLayout>} />
              <Route path="/ai-chat" element={<AppLayout><AIChat /></AppLayout>} />
              <Route path="/test-create" element={<AppLayout><TestCreate /></AppLayout>} />
              <Route path="/test/:id" element={<TestAttempt />} />
              <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
            </Routes>
          </BrowserRouter>
        </ClassProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
