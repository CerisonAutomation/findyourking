import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Profile",
  description: "Manage your profile, photos, and preferences.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
