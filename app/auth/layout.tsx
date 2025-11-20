import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your FindYourKing account to connect with matches.",
  openGraph: {
    title: "Sign In | FindYourKing",
    description: "Sign in to connect with your matches.",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
