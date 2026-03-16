import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // Determine role based on email for demo purposes
      let role: "student" | "staff" | "admin" = "student";
      if (email.includes("staff")) {
        role = "staff";
      } else if (email.includes("admin")) {
        role = "admin";
      }

      await login(email, password, role);
      toast.success("Login successful!");
      navigate(`/${role}/dashboard`);
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl mb-6 text-center text-[#1F2937]">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-2 text-[#1F2937]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors"
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-2 text-[#1F2937]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#F3F3F5] border border-transparent focus:border-[#2563EB] focus:outline-none transition-colors pr-12"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-[#6B7280]">
          Don't have an account?{" "}
          <Link to="/auth/register" className="text-[#2563EB] hover:underline">
            Register
          </Link>
        </p>
      </div>

      <div className="mt-8 p-4 bg-[#EEF2FF] rounded-lg">
        <p className="text-sm text-[#4F46E5] mb-2">Demo Login Credentials:</p>
        <ul className="text-xs text-[#6B7280] space-y-1">
          <li>Student: student@example.com</li>
          <li>Staff: staff@example.com</li>
          <li>Admin: admin@example.com</li>
          <li>Password: any password</li>
        </ul>
      </div>
    </div>
  );
};
