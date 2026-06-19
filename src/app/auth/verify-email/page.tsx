import type { Metadata } from "next";
import { VerifyEmailClient } from "@/components/features/auth/VerifyEmailClient";

export const metadata: Metadata = {
  title: "Check Your Inbox",
  description: "We've sent a confirmation link to your Ogilvy email address.",
};

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const email =
    typeof searchParams?.email === "string" ? searchParams.email : undefined;

  return <VerifyEmailClient email={email} />;
}
