"use client";

import React from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState = {
  error?: string;
} | null;

/** Submit button — must be inside the <form> to use useFormStatus */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full text-base h-12"
      isLoading={pending}
    >
      {label}
    </Button>
  );
}

type AuthFormProps = {
  mode: "login" | "register";
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction] = useFormState(action, null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const isLogin = mode === "login";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-4"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {isLogin ? "Welcome back" : "Get started"}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-bold text-foreground"
        >
          {isLogin ? "Sign in to your team" : "Create your team"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          {isLogin
            ? "Enter your credentials to access your squad."
            : "Join F26 Fantasy and pick your World Cup squad."}
        </motion.p>
      </div>

      {/* Error banner */}
      {state?.error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </motion.div>
      )}

      {/* Form */}
      <form action={formAction} className="flex flex-col gap-4">
        {!isLogin && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Input
              id="teamName"
              name="teamName"
              type="text"
              label="Team Name"
              placeholder="e.g. Galaxy United"
              autoComplete="organization"
              required
              maxLength={50}
              icon={<User size={16} />}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: isLogin ? 0.25 : 0.3 }}
        >
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            required
            icon={<Mail size={16} />}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: isLogin ? 0.3 : 0.35 }}
          className="relative"
        >
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder={isLogin ? "Your password" : "Min. 8 characters"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={8}
            icon={<Lock size={16} />}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </motion.div>

        {!isLogin && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              label="Confirm Password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              minLength={8}
              icon={<Lock size={16} />}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </motion.div>
        )}

        {isLogin && (
          <div className="text-right">
            <span className="text-xs text-muted-foreground">
              Forgot your password?{" "}
              <span className="text-primary cursor-not-allowed opacity-60">
                Reset (coming soon)
              </span>
            </span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isLogin ? 0.35 : 0.45 }}
          className="mt-2"
        >
          <SubmitButton label={isLogin ? "Sign In" : "Create Account"} />
        </motion.div>
      </form>

      {/* Footer link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        {isLogin ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </>
        )}
      </motion.p>
    </motion.div>
  );
}
