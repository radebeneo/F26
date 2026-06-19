"use client";

import { motion } from "framer-motion";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { resendConfirmationEmail } from "@/app/auth/verify-email/actions";

interface VerifyEmailClientProps {
  email?: string;
}

export function VerifyEmailClient({ email }: VerifyEmailClientProps) {
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    if (!email) return;
    setResent(false);
    setError(null);
    startTransition(async () => {
      const result = await resendConfirmationEmail(email);
      if (result?.error) {
        setError(result.error);
      } else {
        setResent(true);
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      {/* Animated envelope icon */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
        className="mb-8 flex justify-center"
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <Mail className="h-10 w-10 text-primary" strokeWidth={1.5} />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-30" />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-foreground text-center"
      >
        Check your inbox
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="mt-3 text-sm text-muted-foreground text-center leading-relaxed"
      >
        We&apos;ve sent a confirmation link to{" "}
        {email ? (
          <span className="font-semibold text-foreground">{email}</span>
        ) : (
          "your Ogilvy email address"
        )}
        . Click the link in the email to activate your account and start
        building your squad.
      </motion.p>

      {/* Steps */}
      <motion.ol
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-7 space-y-3"
      >
        {[
          "Open your @ogilvy.co.za email",
          "Find the email from F26 Fantasy",
          "Click &quot;Confirm your account&quot;",
        ].map((step, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </motion.ol>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.42 }}
        className="my-7 border-t border-border/30"
      />

      {/* Resend section */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="text-center"
      >
        {resent ? (
          <p className="text-sm text-primary font-medium">
            ✓ Confirmation email resent — check your inbox.
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive it?{" "}
            {email ? (
              <button
                onClick={handleResend}
                disabled={isPending}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={13}
                  className={isPending ? "animate-spin" : ""}
                />
                {isPending ? "Sending…" : "Resend email"}
              </button>
            ) : (
              <Link
                href="/auth/register"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Register again
              </Link>
            )}
          </p>
        )}
      </motion.div>

      {/* Back to login */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.54 }}
        className="mt-6 text-center"
      >
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </motion.div>
    </motion.div>
  );
}
