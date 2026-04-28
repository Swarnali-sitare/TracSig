import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { homePathForRole } from "../../types/apiRoles";
import { AuthBootLoader } from "../common/AuthBootLoader";
import { ThemeToggle } from "../common/ThemeToggle";

export const AuthLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthBootLoader />;
  }

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 transition-colors">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.9]"
        style={{ backgroundImage: "url('/frontpage.webp')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background/80 dark:bg-background/85"
      />
      <div className="absolute left-4 top-4 z-10 flex max-w-[min(100%-10rem,28rem)] items-center gap-3 text-left sm:max-w-none">
        <img
          src="/logo.png"
          alt=""
          width={48}
          height={48}
          className="h-10 w-auto shrink-0 object-contain sm:h-16"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight text-accent-primary sm:text-4xl">
            Tracsig
          </h1>
          <p className="text-sm leading-snug text-muted-foreground sm:text-base">
            Assignment Tracking System
          </p>
        </div>
      </div>
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};
