import type { Metadata } from "next";
import { AuthForm } from "@/components/features/auth/AuthForm";
import { registerAction } from "./actions";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Register for F26 Fantasy and build your FIFA World Cup 2026 dream squad.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" action={registerAction} />;
}
