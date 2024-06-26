/**
 * This Component is ready but the backend is yet to implemented, so we are currently using a simpler one member at a time setup until the backend is ready
 */

import { Button } from '@/src/components/shadcn-ui/button';
import { MultiSelect } from '@/src/components/shared/multiselect';
import { api } from '@/src/lib/trpc';
import { useGlobalStore } from '@/src/providers/global-store-provider';
import { type TypeId } from '@u22n/utils/typeid';
import { useState, useEffect } from 'react';

type Props = {
  teamId: TypeId<'teams'>;
  existingMembers: TypeId<'orgMembers'>[];
  complete: () => void;
};

export function EditMemberList({ teamId, existingMembers, complete }: Props) {
  const orgShortCode = useGlobalStore((state) => state.currentOrg.shortCode);
  const { data: allMembers, isLoading } =
    api.org.users.members.getOrgMembers.useQuery({
      orgShortCode
    });
  const { mutateAsync: saveList } =
    api.org.users.teams.updateTeamMembers.useMutation();

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    if (!allMembers) return;
    setSelectedMembers(
      allMembers.members
        ?.filter((member) =>
          existingMembers.some(
            (existingMember) => existingMember === member.publicId
          )
        )
        .map((m) => m.publicId) ?? []
    );
  }, [allMembers, existingMembers]);

  return isLoading ? (
    <div className="font-bold">Loading...</div>
  ) : (
    <div className="flex flex-col gap-2">
      <div className="font-bold">Edit Members List</div>
      <MultiSelect
        items={
          allMembers?.members?.map((m) => ({
            name: `${m.profile.firstName} ${m.profile.lastName}`,
            value: m.publicId,
            keywords: [m.profile.handle ?? '', m.profile.title ?? '']
          })) ?? []
        }
        ItemRenderer={(item) => <div>{item.name}</div>}
        values={selectedMembers}
        setValues={setSelectedMembers}
        TriggerRenderer={(props) => (
          <div className="flex flex-wrap gap-1">
            {props.items.map((item, i, all) => (
              <span key={item.value}>
                {item.name}
                {i !== all.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
      />
      <Button
        className="w-fit"
        onClick={async () => {
          await saveList({
            orgShortCode,
            teamPublicId: teamId,
            orgMemberPublicIds: selectedMembers
          });
          complete();
        }}>
        Save
      </Button>
    </div>
  );
}
