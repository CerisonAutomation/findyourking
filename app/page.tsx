import { DeployButton } from "@/components/deploy-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col">
      <div className="flex-1 w-full">
        {/* Hero Section */}
        <section className="w-full border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <Hero />
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="w-full py-16 sm:py-20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Get Started
                </h2>
                <p className="text-lg text-muted-foreground">
                  Follow these steps to start using FindYourKing
                </p>
              </div>
              <SignUpUserSteps />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FindYourKing. Built with{" "}
              <a
                href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                target="_blank"
                className="font-semibold underline-offset-4 hover:underline hover:text-foreground transition-colors"
                rel="noreferrer"
              >
                Supabase
              </a>
              {" "}and{" "}
              <a
                href="https://nextjs.org/"
                target="_blank"
                className="font-semibold underline-offset-4 hover:underline hover:text-foreground transition-colors"
                rel="noreferrer"
              >
                Next.js
              </a>
            </p>
            <ThemeSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}
