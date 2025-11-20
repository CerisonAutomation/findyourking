"use client";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useState } from "react";
import { Flame, Heart, MessageCircle, Trophy, User, LogOut, Menu, X } from "lucide-react";

export default function Navbar() {
  const { signOut, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/matches", label: "Discover", Icon: Flame },
    { href: "/matches/list", label: "Matches", Icon: Heart },
    { href: "/chat", label: "Messages", Icon: MessageCircle },
    { href: "/pricing", label: "Premium", Icon: Trophy },
    { href: "/profile", label: "My Profile", Icon: User },
  ];

  return (
    <nav className="sticky top-0 z-header backdrop-blur-xl bg-black/80 border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - High-end branding */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-yellow-600 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
              <Trophy size={20} className="text-white font-black" />
            </div>
            <span className="text-lg font-black text-transparent bg-clip-text bg-linear-to-r from-white to-yellow-200 hidden sm:inline">
              Find Your King
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const IconComponent = link.Icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="nav-link"
                    title={link.label}
                  >
                    <span className="relative z-10 flex items-center space-x-1">
                      <IconComponent size={18} className="text-inherit" />
                      <span>{link.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Mobile Menu & Auth */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Toggle - Only show for authenticated users */}
            {user && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}

            {/* Auth Buttons */}
            {user ? (
              <button
                onClick={signOut}
                className="group px-5 py-2 bg-linear-to-r from-red-500/20 to-orange-500/20 text-red-300 hover:text-red-100 border border-red-500/30 hover:border-red-500/60 text-sm font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
              >
                <span className="flex items-center space-x-2">
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </span>
              </button>
            ) : (
              <Link
                href="/auth"
                className="group px-6 py-2 bg-linear-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-pink-500/50 transform hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {user && isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const IconComponent = link.Icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300"
                  >
                    <IconComponent size={20} className="text-inherit" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
