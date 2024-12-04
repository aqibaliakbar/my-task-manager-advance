"use client";

import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelector } from "react-redux";

import { useToast } from "@/hooks/use-toast";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, User, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useAddTeamMemberMutation,
  useCreateTeamMutation,
  useGetUsersQuery,
} from "@/redux/features/services/api";

function HeaderTeamCreationDialog({ onClose }) {
  const { toast } = useToast();
  const { session } = useSelector((state) => state.user);
  const user = session?.user;

  const [teamName, setTeamName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([user?.id]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: allUsers = [], isLoading: isLoadingUsers } = useGetUsersQuery();
  const [createTeam] = useCreateTeamMutation();
  const [addTeamMember] = useAddTeamMemberMutation();

  const filteredUsers = allUsers.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleUserToggle = (userId) => {
    if (userId === user?.id) return;
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Workspace name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const teamResult = await createTeam({
        name: teamName.trim(),
        created_by: user?.id,
        created_at: new Date().toISOString(),
      }).unwrap();

      const teamId = teamResult[0].id;

      const memberPromises = selectedUsers.map((userId) => {
        const memberUser = allUsers.find((u) => u.id === userId);
        if (memberUser) {
          return addTeamMember({
            team_id: teamId,
            user_id: userId,
            email: memberUser.email,
            created_at: new Date().toISOString(),
          }).unwrap();
        }
      });

      await Promise.all(memberPromises);

      toast({
        title: "Success",
        description: "workspace created successfully",
      });
      onClose();
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create workspace",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Workspace</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="teamName" className="text-sm font-medium">
            Workspace Name
          </label>
          <Input
            id="teamName"
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground text-right">
            {teamName.length}/50 characters
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Team Members</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isLoadingUsers}
              >
                {isLoadingUsers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>{selectedUsers.length} members selected</>
                )}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search users..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      {filteredUsers.map((memberUser) => (
                        <CommandItem
                          key={memberUser.id}
                          onSelect={() => handleUserToggle(memberUser.id)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Checkbox
                              checked={selectedUsers.includes(memberUser.id)}
                              disabled={memberUser.id === user?.id}
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {memberUser.full_name
                                  ?.charAt(0)
                                  .toUpperCase() || (
                                  <User className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <p className="text-sm font-medium truncate">
                                {memberUser.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {memberUser.email}
                              </p>
                            </div>
                            {memberUser.id === user?.id && (
                              <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                Owner
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selected Members</label>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {selectedUsers.map((userId) => {
                  const memberUser = allUsers.find((u) => u.id === userId);
                  if (!memberUser) return null;

                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between bg-muted p-2 rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {memberUser.full_name?.charAt(0).toUpperCase() || (
                              <User className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {memberUser.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {memberUser.email}
                          </p>
                        </div>
                      </div>
                      {userId !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUserToggle(userId)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove member</span>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button variant="outline" disabled={isLoading}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          onClick={handleCreateTeam}
          disabled={isLoading || !teamName.trim() || selectedUsers.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Workspace"
          )}
        </Button>
      </div>
    </DialogContent>
  );
}

export default HeaderTeamCreationDialog;
