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
      await login(email, password);
      toast.success("Login successful!");
      // Role is set in AuthContext from API response; read from localStorage
      const stored = localStorage.getItem("tracsig_user");
      const role = stored ? JSON.parse(stored).role : "student";
      navigate(`/${role}/dashboard`);
    } catch {
      toast.error("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-lg transition-colors">
      <h2 className="mb-6 text-center text-2xl text-foreground">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-input-background px-4 py-3 pr-12 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-primary-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/auth/register" className="text-accent-primary hover:underline">
            Register
          </Link>
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-muted p-4">
        <p className="mb-2 text-sm font-medium text-accent-primary">Demo Login Credentials:</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>Student: student@tracsig.com / student123</li>
          <li>Staff: staff@tracsig.com / staff123</li>
          <li>Admin: admin@tracsig.com / admin123</li>
          <li>Password: any password</li>
        </ul>
      </div>
    </div>
  );
};
