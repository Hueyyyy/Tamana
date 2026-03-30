import { useQueryState, parseAsBoolean, parseAsStringEnum, parseAsString } from 'nuqs'
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

  const [projectId, setProjectId] = useQueryState(
    'project-id',
    parseAsString.withOptions({ clearOnDefault: true }),
  )

  const open = (initialStatus?: TaskStatus, projectId?: string) => {
    setIsOpen(true)
    setInitialStatus(initialStatus ?? null)
    setProjectId(projectId ?? null)
  }
  const close = () => {
    setIsOpen(false)
    setInitialStatus(null)
    setProjectId(null)
  }

  return { isOpen, open, close, setIsOpen, initialStatus, projectId }
}
