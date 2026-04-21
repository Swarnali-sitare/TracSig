import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { homePathForRole } from "../../types/apiRoles";
import { Loader2 } from "lucide-react";
import { PasswordInputWithToggle } from "../common/PasswordInputWithToggle";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const u = await login(email, password);
      toast.success("Login successful!");
      const state = location.state as { from?: { pathname?: string; search?: string } } | undefined;
      const from = state?.from;
      const resume =
        from?.pathname &&
        from.pathname.startsWith("/") &&
        !from.pathname.startsWith("/auth")
          ? `${from.pathname}${from.search ?? ""}`
          : null;
      navigate(resume ?? homePathForRole(u.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
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

        <PasswordInputWithToggle
          id="password"
          label="Password"
          labelClassName="mb-2 block text-foreground"
          variant="auth"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={isLoading}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-primary-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-border bg-muted p-4">
        <p className="mb-2 text-sm font-medium text-accent-primary">Local demo (after `flask seed-demo`):</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>Student: student@example.com / student123</li>
          <li>Faculty: faculty@example.com / faculty123</li>
          <li>Admin: use ADMIN_EMAIL and ADMIN_PASSWORD from backend `.env` (not created by seed)</li>
        </ul>
      </div>
    </div>
  );
};
