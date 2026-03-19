import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'default' | 'wide' | 'full'
  noPadding?: boolean
}

export default function PageContainer({
  children,
  className,
  size = 'default',
  noPadding = false,
}: PageContainerProps) {
  const maxWidth = {
    default: 'max-w-[680px]',
    wide: 'max-w-[860px]',
    full: 'max-w-full',
  }[size]

  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidth,
        !noPadding && 'px-4 sm:px-6',
        className
      )}
    >
      {children}
    </div>
  )
}
