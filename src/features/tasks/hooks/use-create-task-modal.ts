import { useQueryState, parseAsBoolean, parseAsStringEnum } from 'nuqs'
import { TaskStatus } from '../types'

export const useCreateTaskModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    'create-task',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true }),
  )

  const [initialStatus, setInitialStatus] = useQueryState(
    'initial-status',
    parseAsStringEnum(Object.values(TaskStatus)).withOptions({ clearOnDefault: true }),
  )

  const open = (initialStatus?: TaskStatus) => {
    setIsOpen(true)
    setInitialStatus(initialStatus ?? null)
  }
  const close = () => {
    setIsOpen(false)
    setInitialStatus(null)
  }

  return { isOpen, open, close, setIsOpen, initialStatus }
}
