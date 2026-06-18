import type { Metadata } from "next";
import { AuthForm } from "@/components/features/auth/AuthForm";
import { loginAction } from "./actions";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your F26 Fantasy account to manage your squad.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : undefined;

  return <AuthForm mode="login" action={loginAction} message={message} />;
}
