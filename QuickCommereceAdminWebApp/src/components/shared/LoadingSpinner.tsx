"use client"

import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  minHeightClassName?: string
}

export function LoadingSpinner({
  message = "Loading...",
  minHeightClassName = "min-h-96",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${minHeightClassName}`}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
