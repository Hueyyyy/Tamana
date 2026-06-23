import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MemberAvatarProps {
  name?: string
  imageUrl?: string
  className?: string
  fallbackClassName?: string
}

export const MemberAvatar = ({
  name,
  imageUrl,
  className,
  fallbackClassName,
}: MemberAvatarProps) => {
  // When we have a real image URL, use Radix Avatar so the image loads
  // properly with an automatic fallback on error.
  // When there's no URL, render the fallback directly — bypassing Radix's
  // state machine so the initial letter shows instantly with no delay.
  if (imageUrl) {
    return (
      <Avatar className={cn('size-5 transition border border-neutral-400 rounded-full relative overflow-hidden', className)}>
        <AvatarImage src={imageUrl} alt={name} className="object-cover" />
        <AvatarFallback className={cn('bg-neutral-200 font-medium text-neutral-500 flex items-center justify-center', fallbackClassName)}>
          {name ? name[0].toUpperCase() : '?'}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <div className={cn(
      'size-5 aspect-square shrink-0 transition border border-neutral-400 rounded-full overflow-hidden',
      'bg-neutral-200 flex items-center justify-center',
      className
    )}>
      <span className={cn('font-medium text-neutral-500 leading-none select-none', fallbackClassName)}>
        {name ? name[0].toUpperCase() : '?'}
      </span>
    </div>
  )
}
