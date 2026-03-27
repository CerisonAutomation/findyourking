'use client'

import {createContext, useContext, useEffect, useState} from 'react'
import type {Session} from './better-auth'

interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface AuthContextType {
    user: User | null
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check session on mount
        async function checkSession() {
            try {
                const response = await fetch('/api/auth/session')
                const data = await response.json()

                if (data.session) {
                    setSession(data.session)
                    setUser(data.session.user)
                }
            } catch (error) {
                console.error('Failed to check session:', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkSession()
    }, [])

    const isAuthenticated = Boolean(session && user)

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isLoading,
                isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
