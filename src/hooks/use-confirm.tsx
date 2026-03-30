import { useState } from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { ResponsiveModal } from '@/components/responsive-modal'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

interface UseConfirmProps {
  title: string
  message: string
  variant: ButtonProps['variant']
}

const useConfirm = ({
  title,
  message,
  variant = 'primary',
}: UseConfirmProps): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = () => {
    return new Promise((resolve) => {
      setPromise({ resolve })
    })
  }

  const handleClose = () => {
    setPromise(null)
  }

  const handleConfirm = () => {
    promise?.resolve(true)
    handleClose()
  }

  const handleCancel = () => {
    promise?.resolve(false)
    handleClose()
  }

  const ConfirmationDialog = () => (
    <ResponsiveModal isOpen={promise !== null} onOpenChange={handleClose}>
      <Card className="w-full h-full border-none shadow-none">
        <CardContent className="pt-8">
          <CardHeader className="p-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <div className="flex flex-col items-center justify-end w-full pt-4 gap-y-2 lg:flex-row gap-x-2 ">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full lg:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant={variant}
              onClick={handleConfirm}
              className="w-full lg:w-auto"
            >
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    </ResponsiveModal>
  )

  return [ConfirmationDialog, confirm]
}

export default useConfirm
