import { cn } from '@/lib/utils'

interface AdminContainerProps {
  children: React.ReactNode
  className?: string
}

export default function AdminContainer({
  children,
  className,
}: AdminContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1200px] px-4 sm:px-6 md:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}
