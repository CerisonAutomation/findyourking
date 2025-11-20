import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Matches",
  description: "Find your perfect match. Browse profiles and connect with people who share your interests.",
  openGraph: {
    title: "Discover Matches | FindYourKing",
    description: "Find your perfect match and connect with like-minded people.",
  },
};

export default function MatchesLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
