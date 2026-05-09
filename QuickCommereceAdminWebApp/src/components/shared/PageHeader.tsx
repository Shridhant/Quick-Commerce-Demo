"use client"

import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  meta?: ReactNode
}

export function PageHeader({ title, description, actions, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {meta ? <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
