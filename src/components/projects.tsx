'use client';

//Hooks
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useCreateProjectModal } from '@/features/projects/hooks/use-create-project-modal';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { usePathname } from 'next/navigation';
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { MemberRole } from '@/features/members/type';

//Next
import Link from 'next/link';

//Libs
import { cn } from '@/lib/utils';

//Icons
import { RiAddCircleFill } from 'react-icons/ri';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';

export const Projects = () => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: members } = useGetMembers({ workspaceId });
  const { data } = useGetProjects({ workspaceId });
  const pathname = usePathname();
  const { open } = useCreateProjectModal();

  const currentMember = members?.documents.find((m) => m.userId === user?.$id);
  const isAdmin = currentMember?.role === MemberRole.ADMIN;

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-neutral-500">Projects</p>
        {isAdmin && (
          <RiAddCircleFill
            className="size-5 text-neutral-500 cursor-pointer hover:opacity-75 transition"
            onClick={open}
          />
        )}
      </div>
      <div className="max-h-[500px] overflow-y-auto pb-6 md:pb-0">
        {data?.documents.map((project) => {
          const href = `/workspaces/${workspaceId}/projects/${project.$id}`;
          const isActive = pathname === href;
          return (
            <Link href={href} key={project.$id}>
              <div
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-md hover:opacity-75 transition cursor-pointer text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100',
                  isActive &&
                    'bg-white dark:bg-neutral-800 shadow-sm hover:opacity-100 text-neutral-900 dark:text-neutral-100',
                )}
              >
                <ProjectAvatar name={project.name} image={project.imageUrl} />
                <span className="truncate">{project.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
