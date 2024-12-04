"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  ChevronDown,
  Laptop,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSelector, useDispatch } from "react-redux";
import { useGetTeamsQuery } from "@/redux/features/services/api";
import { signOut } from "@/redux/features/userSlice";
import { useTheme } from "../Theme-Provider";
import HeaderTeamCreationDialog from "../teams/HeaderTeamCreationDialog";
import { setCurrentTeam } from "@/redux/features/teamSlice";

function Header() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { session } = useSelector((state) => state.user);
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const { data: teams = [] } = useGetTeamsQuery();
  const currentTeam = useSelector((state) => state.team.currentTeam);

  useEffect(() => {
    const savedTeam = localStorage.getItem("currentTeam");
    if (savedTeam && !currentTeam) {
      dispatch(setCurrentTeam(JSON.parse(savedTeam)));
    } else if (teams.length > 0 && !currentTeam) {
      dispatch(setCurrentTeam(teams[0]));
    }
  }, [teams, currentTeam, dispatch]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeamChange = (team) => {
    dispatch(setCurrentTeam(team));
    router.push(`/teams/${team.id}`);
  };

  const handleSignOut = async () => {
    try {
      await dispatch(signOut()).unwrap();
      router.push("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="h-20 fixed border-b bg-background flex items-center px-4 justify-between w-screen z-50">
      <div className="flex items-center space-x-4 ">
        <SidebarTrigger />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <span>{currentTeam?.name || "Select Workspace"}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <div className="p-2">
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="max-h-[300px] overflow-auto">
              {filteredTeams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => handleTeamChange(team)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{team.name}</span>
                    {team.team_members?.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({team.team_members.length})
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-2 mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Workspace
                </Button>
              </DialogTrigger>
              <HeaderTeamCreationDialog
                onClose={() => setIsTeamDialogOpen(false)}
              />
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 max-w-xl px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search..." className="pl-10 bg-background" />
        </div>
      </div>

      <div className="flex items-center space-x-4 pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Laptop className="mr-2 h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar>
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <p className="font-medium">{user?.user_metadata?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
