'use client'

//assets
import { SettingsIcon, UserIcon } from 'lucide-react'
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,
} from 'react-icons/go'

//components
import Link from 'next/link'

//helpers
import { cn } from '@/lib/utils'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import { usePathname } from 'next/navigation'

const routes = [
  {
    label: 'Home',
    href: '',
    icon: GoHome,
    activeIcon: GoHomeFill,
  },
  {
    label: 'My Tasks',
    href: '/tasks',
    icon: GoCheckCircle,
    activeIcon: GoCheckCircleFill,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
    activeIcon: SettingsIcon,
  },
  {
    label: 'Members',
    href: '/members',
    icon: UserIcon,
    activeIcon: UserIcon,
  },
]

export const Navigation = () => {
  const workspaceId = useWorkspaceId()
  const pathname = usePathname()

  return (
    <div className="flex flex-col">
      {routes.map((item) => {
        const fullHref = `/workspaces/${workspaceId}${item.href}`
        const isActive = pathname === fullHref
        const Icon = isActive ? item.activeIcon : item.icon

        return (
          <Link key={item.href} href={fullHref}>
            <div
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-neutral-900 dark:hover:text-neutral-100 transition text-neutral-500',
                isActive
                  ? 'bg-white dark:bg-neutral-800 shadow-sm hover:opacity-100 text-neutral-900 dark:text-neutral-100'
                  : 'hover:text-neutral-900 dark:hover:text-neutral-100',
              )}
            >
              <Icon className={cn('size-5 text-neutral-500', isActive && 'text-neutral-900 dark:text-neutral-100')} />
              {item.label}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
