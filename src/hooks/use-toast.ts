'use client'

import {toast as sonnerToast} from "sonner"

export type ToastProps = {
    title?: string
    description?: string
    variant?: 'default' | 'destructive'
    duration?: number
}

export function useToast() {
    const toast = ({title, description, variant, duration, ...props}: ToastProps) => {
        const options = {
            description,
            duration,
            ...props,
        }

        if (variant === 'destructive') {
            return sonnerToast.error(title || "Error", options)
        }

        return sonnerToast.success(title || "Success", options)
    }

    return {
        toast,
        dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    }
}
