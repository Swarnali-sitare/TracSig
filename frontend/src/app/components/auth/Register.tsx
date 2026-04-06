import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, UserRole } from "../../context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../../services/api";
import { fetchPublicBatches, type PublicBatch } from "../../services/tracsigApi";

export const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [batchId, setBatchId] = useState<number | "">("");
  const [department, setDepartment] = useState("");
  const [teachingLoad, setTeachingLoad] = useState("");
  const [batches, setBatches] = useState<PublicBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoadingBatches(true);
    setBatchError(null);

    void fetchPublicBatches()
      .then((r) => setBatches(r.items))
      .catch(() => {
        setBatches([]);
        setBatchError("Unable to load batch options.");
      })
      .finally(() => setIsLoadingBatches(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (role === "student" && batchId === "") {
      toast.error("Please select a batch");
      return;
    }

    setIsLoading(true);
    try {
      const u = await register(name, email, password, role, {
        batchId: role === "student" ? Number(batchId) : undefined,
        department: role === "faculty" ? (department.trim() || null) : undefined,
        teachingLoadHours:
          role === "faculty" && teachingLoad.trim() !== "" ? Number(teachingLoad) : undefined,
      });
      toast.success("Registration successful!");
      const path =
        u.role === "faculty" ? "/faculty/dashboard" : u.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      navigate(path);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-lg transition-colors">
      <h2 className="mb-6 text-center text-2xl text-foreground">Register</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-2 block text-foreground">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            placeholder="Enter your full name"
            disabled={isLoading}
          />
        </div>

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

        <div>
          <label htmlFor="role" className="mb-2 block text-foreground">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground transition-colors focus:border-primary focus:outline-none"
            disabled={isLoading}
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        {role === "student" && (
          <div>
            <label htmlFor="batch" className="mb-2 block text-foreground">
              Batch <span className="text-error">*</span>
            </label>
            <select
              id="batch"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground transition-colors focus:border-primary focus:outline-none"
              disabled={isLoading || isLoadingBatches || batches.length === 0}
              required
            >
              <option value="">{isLoadingBatches ? "Loading batches..." : "Select batch"}</option>
              {batches.length === 0 && !isLoadingBatches && (
                <option value="" disabled>
                  No batches configured
                </option>
              )}
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            {batchError ? (
              <p className="mt-2 text-sm text-destructive">{batchError}</p>
            ) : batches.length === 0 && !isLoadingBatches ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No batch options are available. Ask your administrator to add a batch or run the backend seed command.
              </p>
            ) : null}
          </div>
        )}

        {role === "faculty" && (
          <>
            <div>
              <label htmlFor="department" className="mb-2 block text-foreground">
                Department (optional)
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground transition-colors focus:border-primary focus:outline-none"
                placeholder="e.g. Computer Science"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="teachingLoad" className="mb-2 block text-foreground">
                Teaching load hours/week (optional)
              </label>
              <input
                id="teachingLoad"
                type="number"
                min={1}
                max={20}
                value={teachingLoad}
                onChange={(e) => setTeachingLoad(e.target.value)}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-foreground transition-colors focus:border-primary focus:outline-none"
                placeholder="e.g. 6"
                disabled={isLoading}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={
            isLoading ||
            (role === "student" && !isLoadingBatches && batches.length === 0)
          }
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-primary-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-accent-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
