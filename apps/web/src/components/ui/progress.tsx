import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", className)}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value || 0))}% )` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }
