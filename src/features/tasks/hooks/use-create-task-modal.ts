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

  const [parentId, setParentId] = useQueryState(
    'parent-id',
    parseAsString.withOptions({ clearOnDefault: true }),
  )

  const open = (initialStatus?: TaskStatus, projectId?: string, parentId?: string) => {
    setIsOpen(true)
    setInitialStatus(initialStatus ?? null)
    setProjectId(projectId ?? null)
    setParentId(parentId ?? null)
  }
  const close = () => {
    setIsOpen(false)
    setInitialStatus(null)
    setProjectId(null)
    setParentId(null)
  }

  return { isOpen, open, close, setIsOpen, initialStatus, projectId, parentId }
}
