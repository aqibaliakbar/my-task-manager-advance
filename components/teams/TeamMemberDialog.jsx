"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Check, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  useAddTeamMemberMutation,
  useGetTeamMembersQuery,
  useGetUsersQuery,
} from "@/redux/features/services/api";
import { useToast } from "@/hooks/use-toast";

function TeamMemberDialog({ teamId, onClose }) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: allUsers = [] } = useGetUsersQuery();
  const { data: existingMembers = [], refetch: refetchMembers } =
    useGetTeamMembersQuery(teamId);
  const [addTeamMember] = useAddTeamMemberMutation();

  const availableUsers = allUsers.filter((user) => {
    const isExistingMember = existingMembers.some(
      (member) => member.user_id === user.id || member.email === user.email
    );
    return !isExistingMember;
  });

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast({ description: "Please select at least one member" });
      return;
    }

    setIsLoading(true);
    try {
      for (const userId of selectedUsers) {
        const userToAdd = allUsers.find((u) => u.id === userId);
        if (userToAdd) {
          await addTeamMember({
            team_id: teamId,
            user_id: userId,
            email: userToAdd.email,
            created_at: new Date().toISOString(),
          }).unwrap();
        }
      }

      await refetchMembers();
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: error,
        description: "Failed to add team members",
      });
      console.error("Error adding team members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Team Members</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Select Members
          </label>
          <Command className="border rounded-md">
            <CommandInput
              placeholder="Search users..."
              className="border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>No users found</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[200px]">
                  {availableUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleUserToggle(user.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10">
                            {user.full_name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Selected Members
            </label>
            {selectedUsers.map((userId) => {
              const user = allUsers.find((u) => u.id === userId);
              if (!user) return null;

              return (
                <Card key={userId}>
                  <CardContent className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>
                          {user.full_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUserToggle(userId)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <DialogClose asChild>
          <Button variant="outline" disabled={isLoading}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          onClick={handleAddMembers}
          disabled={isLoading || selectedUsers.length === 0}
        >
          {isLoading ? "Adding..." : "Add Members"}
        </Button>
      </div>
    </DialogContent>
  );
}

export default TeamMemberDialog;
