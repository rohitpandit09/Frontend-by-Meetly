import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Video, Plus, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">MEETLY</span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user?.role === "teacher" && (
              <button
                onClick={() => navigate("/create-class")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 hover:shadow-glow"
              >
                <Plus className="w-4 h-4" />
                Create Class
              </button>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <User className="w-4 h-4" />
                  {user?.name}
                </Link>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-destructive text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {isAuthenticated && user?.role === "teacher" && (
                <Link to="/create-class" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium text-center">
                  Create Class
                </Link>
              )}
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm">Profile</Link>
                  <button onClick={() => { logout(); navigate("/"); setMobileOpen(false); }} className="px-4 py-2 rounded-lg text-destructive text-sm text-left">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg text-sm text-foreground">Sign In</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm text-center">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
