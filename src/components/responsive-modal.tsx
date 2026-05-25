import { useMedia } from 'react-use'
import { Dialog, DialogContent } from './ui/dialog'
import { Drawer, DrawerContent } from './ui/drawer'
import { cn } from '@/lib/utils'

interface ResponsiveModalProps {
  children: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  maxWidthClassName?: string
}

export const ResponsiveModal = ({
  children,
  isOpen,
  onOpenChange,
  maxWidthClassName,
}: ResponsiveModalProps) => {
  const isDesktop = useMedia('(min-width: 1024px)', true)

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={cn("w-full sm:max-w-lg p-0 border-none overflow-y-auto hide-scrollbar max-h-[85vh]", maxWidthClassName)}>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto hide-scrollbar max-h-[85vh]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
