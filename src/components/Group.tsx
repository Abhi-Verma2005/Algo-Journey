"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2,
  Users,
  UserPlus,
  User,
  Info,
  ChevronDown,
  ChevronRight,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import { Alert, AlertDescription } from "./ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@radix-ui/react-alert-dialog";
import { AlertDialogFooter, AlertDialogHeader } from "./ui/alert-dialog";
import useStore from "@/store/store";
import { Skeleton } from "./ui/skeleton";

interface User {
  id: string;
  username: string;
  email?: string;
}

interface Group {
  id: string;
  name: string;
  coordinator: User;
  coordinatorId: string;
  _count: {
    members: number;
  };
  groupPoints: number;
}

const UnifiedGroupManagement = () => {
  // Session and admin status
  const { data: session } = useSession();
  const { isAdmin, isDarkMode } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  // Group management view state
  const [activeTab, setActiveTab] = useState<"create" | "update">("create");
  const [showExistingGroups, setShowExistingGroups] = useState(false);

  // Group data
  const [existingGroups, setExistingGroups] = useState<Group[]>([]);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // User data
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [coordinator, setCoordinator] = useState<string | null>(null);

  // Form inputs
  const [groupName, setGroupName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Operation states
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingGroup, setIsFetchingGroup] = useState(false);
  const [groupFetched, setGroupFetched] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);

  // Check if user is admin and fetch initial data
  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await axios.post("/api/checkIfCoordinator");
        setIsCoordinator(response.data.isCoordinator);
        let usersData: User[] = [];
        if (isAdmin) {
          const usersResponse = await axios.post("/api/getUsersForAdmin");
          if (Array.isArray(usersResponse.data.users)) {
            usersData = usersResponse.data.users;
            setUsers(usersData);
          }
        } else {
          const usersResponse = await axios.post("/api/getUsers");
          if (Array.isArray(usersResponse.data.users)) {
            usersData = usersResponse.data.users;
            setUsers(usersData);
          }
        }

        // Fetch user's current group
        if (session?.user?.email) {
          await fetchUserGroup();
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [session?.user?.email]);

  const fetchUserGroup = useCallback(async () => {
    try {
      const response = await axios.post("/api/groups", {
        body: {
          userEmail: session?.user?.email,
        },
      });

      if (response.data.userGroup) {
        setUserGroup(response.data.userGroup);
      } else {
        setUserGroup(null);
      }
    } catch (err) {
      console.error("Error fetching user group:", err);
      toast.error("Failed to fetch your group");
    }
  }, [session?.user?.email]);

  const fetchExistingGroups = async () => {
    setError("");
    try {
      const response = await axios.post("/api/groups", {
        body: {
          userEmail: session?.user?.email,
        },
      });
      setExistingGroups(response.data.groups);
      setShowExistingGroups(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  const fetchGroupMembers = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter an existing group name");
      return;
    }

    setIsFetchingGroup(true);

    try {
      const response = await axios.post("/api/getGroupMembersToUpdate", {
        groupName: groupName.trim(),
      });

      const { data } = response;

      if (data.members && Array.isArray(data.members)) {
        setSelectedUsers(data.members.map((user: User) => user.id));

        // Merge members with existing users, avoiding duplicates
        setUsers((prevUsers) => {
          const existingUserIds = new Set(prevUsers.map((user) => user.id));
          const newUsers = data.members.filter(
            (user: User) => !existingUserIds.has(user.id)
          );
          return [...prevUsers, ...newUsers];
        });

        // Set coordinator if it exists in the response
        if (data.coordinator) {
          setCoordinator(data.coordinator);
        }

        setGroupFetched(true);
        toast.success("Group members loaded successfully");
      } else {
        toast.error("Failed to fetch group members");
      }
    } catch (err) {
      console.error("Error fetching group members:", err);
      toast.error("Group not found or error fetching members");
    } finally {
      setIsFetchingGroup(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCoordinatorSelect = (userId: string) => {
    setCoordinator(userId === coordinator ? null : userId);
  };

  const resetForm = () => {
    setSelectedUsers([]);
    setCoordinator(null);
    setGroupName("");
    setNewGroupName("");
    setSearchTerm("");
    setGroupFetched(false);
    setSelectedGroupId(null);
    setShowAddMembers(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await axios.post("/api/groups/join", {
        groupId,
        userEmail: session?.user?.email,
      });

      if (response.status === 200) {
        toast.success("Joined group successfully");
        fetchUserGroup();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to join group");
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await axios.post("/api/groups/leave", {
        groupId,
        userEmail: session?.user?.email,
      });

      if (response.status === 200) {
        toast.success("Left group successfully");
        fetchUserGroup();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to leave group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete groups");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.post("/api/groups/delete", {
        groupId,
      });

      if (response.status === 200) {
        toast.success("Group deleted successfully");
        fetchExistingGroups();
        fetchUserGroup();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete group");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateOrUpdateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    if (!coordinator && activeTab === "create") {
      toast.error("Please select a coordinator");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post("/api/groups/create", {
        name: groupName.trim(),
        users: selectedUsers,
        newGroupName: activeTab === "update" ? newGroupName.trim() : undefined,
        coordinator,
        mode: activeTab,
      });

      toast.success(
        `Group ${activeTab === "create" ? "created" : "updated"} successfully`
      );
      resetForm();
      setActiveTab("create");
      fetchExistingGroups();
      fetchUserGroup();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${activeTab} group`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMembers = async () => {
    if (!selectedGroupId) {
      toast.error("No group selected");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await axios.post("/api/groups/addMember", {
        groupId: selectedGroupId,
        userIds: selectedUsers,
      });

      toast.success("Members added successfully");
      setSelectedUsers([]);
      setShowAddMembers(false);
      fetchExistingGroups();
    } catch (err) {
      console.error("Error adding members:", err);
      toast.error("Failed to add members");
      setError("Failed to add members");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMemberSelectionList = () => (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className={`absolute left-3 top-2.5 h-4 w-4 ${
            isDarkMode ? "text-zinc-500" : "text-zinc-400"
          }`}
        />
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${
            isDarkMode
              ? "bg-[#262626] border-[#262626] text-zinc-100 placeholder-zinc-500"
              : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-500"
          }`}
        />
      </div>

      <ScrollArea
        className={`h-80 border rounded-lg overflow-auto ${
          isDarkMode ? "border-[#262626]" : "border-zinc-200"
        }`}
      >
        <div className="p-3 space-y-2">
          {filteredUsers.length === 0 ? (
            <div
              className={`text-center py-8 ${
                isDarkMode ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUsers.includes(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected
                      ? isDarkMode
                        ? "bg-indigo-900/30 border-indigo-700/50"
                        : "bg-indigo-50 border-indigo-200"
                      : isDarkMode
                      ? "bg-[#262626] border-[#262626] hover:border-[#404040]"
                      : "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleUserSelect(user.id)}
                      id={`user-${user.id}`}
                      className={
                        isSelected
                          ? "border-indigo-600 text-indigo-600"
                          : isDarkMode
                          ? "border-zinc-600"
                          : "border-zinc-300"
                      }
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className={`cursor-pointer flex items-center gap-2 flex-1 ${
                        isDarkMode ? "text-zinc-200" : "text-zinc-900"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          isDarkMode
                            ? "bg-[#404040] text-zinc-300"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.username}</span>
                      {coordinator === user.id && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            isDarkMode
                              ? "bg-amber-900/30 text-amber-400"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          Coordinator
                        </span>
                      )}
                    </label>
                  </div>
                  <button
                    className={`flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      coordinator === user.id
                        ? isDarkMode
                          ? "bg-amber-900/30 text-amber-400"
                          : "bg-amber-100 text-amber-700"
                        : isDarkMode
                        ? "bg-[#404040] text-zinc-400 hover:bg-[#505050] hover:text-zinc-300"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                    onClick={() => handleCoordinatorSelect(user.id)}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    {coordinator === user.id
                      ? "Coordinator"
                      : "Make Coordinator"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderAddMembersDialog = () => {
    const selectedGroup = existingGroups.find((g) => g.id === selectedGroupId);

    return (
      <Card
        className={`shadow-md border-0 w-full rounded-2xl ${
          isDarkMode ? "bg-[#404040]" : "bg-white"
        }`}
      >
        <CardHeader
          className={`border-b pb-4 ${
            isDarkMode
              ? "bg-[#262626] border-[#262626]"
              : "bg-zinc-50 border-zinc-100"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isDarkMode ? "bg-indigo-900/30" : "bg-indigo-100"
                }`}
              >
                <UserPlus className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-zinc-200" : "text-zinc-800"
                  }`}
                >
                  {selectedGroup?.name || "Group"} - Add Members
                </CardTitle>
                <CardDescription
                  className={isDarkMode ? "text-zinc-400" : "text-zinc-600"}
                >
                  Select users to add to this group
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMembers(false)}
              className={`border ${
                isDarkMode
                  ? "border-[#262626] hover:bg-[#262626] text-zinc-300"
                  : "border-zinc-200 hover:bg-zinc-50 text-zinc-900"
              }`}
            >
              Back to Groups
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {error && (
            <Alert
              className={`border-l-4 border-l-red-500 rounded-lg ${
                isDarkMode
                  ? "bg-red-900/20 text-red-400"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <AlertDescription
                className={isDarkMode ? "text-red-400" : "text-red-600"}
              >
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {renderMemberSelectionList()}

            <div
              className={`flex items-center justify-between text-sm ${
                isDarkMode ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              <div>Selected: {selectedUsers.length} users</div>
            </div>

            <Button
              className={`w-full mt-6 ${
                selectedUsers.length === 0
                  ? isDarkMode
                    ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
              onClick={handleAddMembers}
              disabled={isSubmitting || selectedUsers.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Members...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add {selectedUsers.length} Member
                  {selectedUsers.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>

            {selectedUsers.length > 0 && (
              <div className="text-center mt-2">
                <button
                  onClick={() => setSelectedUsers([])}
                  className={`text-sm transition-colors ${
                    isDarkMode
                      ? "text-zinc-400 hover:text-indigo-400"
                      : "text-zinc-500 hover:text-indigo-600"
                  }`}
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGroupCreationForm = () => (
    <Card
      className={`${
        isDarkMode ? "bg-[#404040]" : "bg-white"
      } border-0 shadow-none rounded-2xl`}
    >
      <CardHeader
        className={`${
          isDarkMode ? "border-[#262626]" : "border-zinc-100"
        } border-b pb-4`}
      >
        <CardTitle
          className={`text-lg font-bold flex items-center gap-2 ${
            isDarkMode ? "text-zinc-200" : "text-zinc-800"
          }`}
        >
          <UserPlus className="h-5 w-5 text-indigo-500" />
          {activeTab === "create" ? "Create New Group" : "Update Group"}
        </CardTitle>
        <CardDescription
          className={isDarkMode ? "text-zinc-400" : "text-zinc-600"}
        >
          {activeTab === "create" ? "Build your team" : "Modify existing group"}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div
          className={`grid grid-cols-2 gap-2 p-1 rounded-lg ${
            isDarkMode ? "bg-[#262626]" : "bg-zinc-100"
          }`}
        >
          <button
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "create"
                ? isDarkMode
                  ? "bg-[#404040] text-indigo-400 shadow-sm"
                  : "bg-white text-indigo-700 shadow-sm"
                : isDarkMode
                ? "text-zinc-400 hover:text-zinc-200"
                : "text-zinc-600 hover:text-zinc-800"
            }`}
            onClick={() => {
              resetForm();
              setActiveTab("create");
            }}
          >
            Create Group
          </button>
          <button
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "update"
                ? isDarkMode
                  ? "bg-[#404040] text-indigo-400 shadow-sm"
                  : "bg-white text-indigo-700 shadow-sm"
                : isDarkMode
                ? "text-zinc-400 hover:text-zinc-200"
                : "text-zinc-600 hover:text-zinc-800"
            }`}
            onClick={() => {
              resetForm();
              setActiveTab("update");
            }}
          >
            Update Group
          </button>
        </div>

        <div className="space-y-4">
          {/* Group name input */}
          <div>
            {activeTab === "update" ? (
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  placeholder="Enter existing group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${
                    isDarkMode
                      ? "bg-[#262626] border-[#262626] text-zinc-100 placeholder-zinc-500"
                      : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-500"
                  }`}
                />
                <Button
                  onClick={fetchGroupMembers}
                  disabled={isFetchingGroup}
                  className={`px-3 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
                    isDarkMode
                      ? "bg-blue-900/30 text-blue-400 border-blue-700/50 hover:bg-blue-800/40"
                      : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                  }`}
                >
                  {isFetchingGroup ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin text-blue-500" />
                      <span>Loading</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Fetch Group</span>
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <Input
                type="text"
                placeholder="Enter new group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={`w-full px-3 py-2 mb-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${
                  isDarkMode
                    ? "bg-[#262626] border-[#262626] text-zinc-100 placeholder-zinc-500"
                    : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-500"
                }`}
              />
            )}

            {activeTab === "update" && groupFetched && (
              <Input
                type="text"
                placeholder="Enter new group name (leave blank to keep current name)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${
                  isDarkMode
                    ? "bg-[#262626] border-[#262626] text-zinc-100 placeholder-zinc-500"
                    : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-500"
                }`}
              />
            )}
          </div>

          {/* User selection */}
          {renderMemberSelectionList()}

          <div
            className={`flex flex-wrap items-center justify-between gap-2 text-sm ${
              isDarkMode ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            <div>Selected: {selectedUsers.length} users</div>
            {coordinator && (
              <div className="text-xs">
                Coordinator: {users.find((u) => u.id === coordinator)?.username}
              </div>
            )}
          </div>

          {/* Submit button */}
          <Button
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:bg-indigo-400"
            onClick={handleCreateOrUpdateGroup}
            disabled={isSubmitting || (activeTab === "update" && !groupFetched)}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {activeTab === "create" ? "Creating..." : "Updating..."}
              </div>
            ) : activeTab === "create" ? (
              "Create Group"
            ) : (
              "Update Group"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderGroupsList = () => (
    <Card
      className={`${
        isDarkMode ? "bg-[#404040]" : "bg-white"
      } border-0 shadow-none rounded-2xl`}
    >
      <CardHeader
        className={`${
          isDarkMode ? "border-[#262626]" : "border-zinc-100"
        } border-b pb-4`}
      >
        <CardTitle
          className={`text-lg font-bold flex items-center gap-2 ${
            isDarkMode ? "text-zinc-200" : "text-zinc-800"
          }`}
        >
          <Users className="h-5 w-5 text-amber-500" />
          My Groups
        </CardTitle>
        <CardDescription
          className={isDarkMode ? "text-zinc-400" : "text-zinc-600"}
        >
          Manage your team memberships
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {error && (
          <Alert
            className={`border-l-4 border-l-red-500 rounded-lg ${
              isDarkMode
                ? "bg-red-900/20 text-red-400"
                : "bg-red-50 text-red-800"
            }`}
          >
            <AlertDescription
              className={isDarkMode ? "text-red-400" : "text-red-600"}
            >
              {error}
            </AlertDescription>
          </Alert>
        )}

        {userGroup ? (
          <div className="space-y-3">
            <h3
              className={`text-sm font-medium flex items-center gap-2 ${
                isDarkMode ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              <User className="h-4 w-4" />
              Current Group
            </h3>
            <div
              className={`rounded-xl border-0 overflow-hidden shadow-sm ${
                isDarkMode ? "bg-[#262626]" : "bg-zinc-50"
              }`}
            >
              <div
                className={`px-4 py-3 flex justify-between items-center ${
                  isDarkMode ? "bg-amber-900/20" : "bg-amber-50/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isDarkMode
                        ? "bg-amber-900/40 text-amber-400"
                        : "bg-amber-200 text-amber-800"
                    }`}
                  >
                    {userGroup.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${
                        isDarkMode ? "text-zinc-200" : "text-zinc-800"
                      }`}
                    >
                      {userGroup.name}
                    </h3>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      {userGroup._count.members} members •{" "}
                      {userGroup.groupPoints || 0} points
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`px-4 py-3 flex flex-wrap gap-2 justify-end ${
                  isDarkMode ? "bg-[#262626]" : "bg-white"
                }`}
              >
                {isCoordinator && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedGroupId(userGroup.id);
                      setSelectedUsers([]);
                      setShowAddMembers(true);
                    }}
                    className={`border flex items-center gap-1 ${
                      isDarkMode
                        ? "border-[#404040] bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/30"
                        : "border-zinc-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    }`}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Members
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleLeaveGroup(userGroup.id)}
                  className={`border ${
                    isDarkMode
                      ? "border-[#404040] bg-red-900/20 text-red-400 hover:bg-red-900/30"
                      : "border-zinc-200 bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                  size="sm"
                >
                  Leave Group
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-xl border-0 overflow-hidden ${
              isDarkMode ? "bg-[#262626]" : "bg-zinc-50"
            }`}
          >
            <div className="px-6 py-8 text-center space-y-4">
              <div
                className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto ${
                  isDarkMode ? "bg-amber-900/20" : "bg-amber-100"
                }`}
              >
                <Users
                  className={`h-8 w-8 ${
                    isDarkMode ? "text-amber-500" : "text-amber-600"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold mb-1 ${
                    isDarkMode ? "text-zinc-200" : "text-zinc-800"
                  }`}
                >
                  Not in a group yet
                </h3>
                <p
                  className={`text-sm max-w-sm mx-auto ${
                    isDarkMode ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  Join a team to collaborate with other developers and
                  participate in team challenges.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={fetchExistingGroups}
          className={`w-full rounded-lg flex items-center justify-center gap-2 transition-colors ${
            isDarkMode
              ? "bg-indigo-900/30 hover:bg-indigo-900/40 text-indigo-400 border border-indigo-800/50"
              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100"
          }`}
          variant="outline"
        >
          <Users className="h-4 w-4" />
          {showExistingGroups ? "Refresh Groups List" : "View Available Groups"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              showExistingGroups ? "transform rotate-180" : ""
            }`}
          />
        </Button>

        {showExistingGroups && (
          <div className="space-y-3 pt-2">
            <h3
              className={`text-sm font-medium flex items-center gap-2 ${
                isDarkMode ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              <Users className="h-4 w-4" />
              Available Groups
            </h3>

            {existingGroups.length === 0 ? (
              <div
                className={`text-center p-6 rounded-xl ${
                  isDarkMode ? "bg-[#262626]" : "bg-zinc-50"
                }`}
              >
                <p
                  className={`flex items-center justify-center gap-2 text-sm ${
                    isDarkMode ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  <Info className="h-4 w-4" />
                  No groups found
                </p>
              </div>
            ) : (
              existingGroups.map((group) => (
                <div
                  key={group.id}
                  className={`rounded-xl border-0 overflow-hidden shadow-sm ${
                    isDarkMode ? "bg-[#262626]" : "bg-zinc-50"
                  }`}
                >
                  <div
                    className={`px-4 py-3 flex justify-between items-center border-b ${
                      isDarkMode ? "border-[#404040]" : "border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isDarkMode
                            ? "bg-indigo-900/40 text-indigo-400"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3
                          className={`font-semibold ${
                            isDarkMode ? "text-zinc-200" : "text-zinc-800"
                          }`}
                        >
                          {group.name}
                        </h3>
                        <p
                          className={`text-xs flex items-center gap-1.5 ${
                            isDarkMode ? "text-zinc-400" : "text-zinc-600"
                          }`}
                        >
                          <User className="h-3 w-3" />
                          {group.coordinator.username} • {group._count.members}{" "}
                          members
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-4 py-3 flex flex-wrap gap-2 justify-end ${
                      isDarkMode ? "bg-[#262626]" : "bg-white"
                    }`}
                  >
                    {!userGroup && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJoinGroup(group.id)}
                        className={`border flex items-center gap-1 ${
                          isDarkMode
                            ? "border-[#404040] bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/30"
                            : "border-zinc-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        }`}
                      >
                        Join Group <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`border flex items-center gap-1 ${
                                isDarkMode
                                  ? "border-[#404040] bg-red-900/20 text-red-400 hover:bg-red-900/30"
                                  : "border-zinc-200 bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            className={`p-0 overflow-hidden rounded-xl ${
                              isDarkMode ? "bg-[#262626]" : "bg-white"
                            }`}
                          >
                            <AlertDialogHeader
                              className={`px-5 py-4 border-b ${
                                isDarkMode
                                  ? "bg-red-900/20 border-[#404040]"
                                  : "bg-red-50 border-red-100"
                              }`}
                            >
                              <AlertDialogTitle
                                className={`text-lg font-semibold flex items-center gap-2 ${
                                  isDarkMode ? "text-red-400" : "text-red-700"
                                }`}
                              >
                                <AlertCircle className="h-5 w-5" />
                                Delete Group
                              </AlertDialogTitle>
                              <AlertDialogDescription
                                className={
                                  isDarkMode ? "text-zinc-400" : "text-zinc-600"
                                }
                              >
                                This action cannot be undone. All members will
                                be removed from this group.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="p-5">
                              <p
                                className={`text-sm mb-6 ${
                                  isDarkMode ? "text-zinc-300" : "text-zinc-600"
                                }`}
                              >
                                Are you sure you want to delete{" "}
                                <span className="font-semibold">
                                  {group.name}
                                </span>
                                ?
                              </p>
                              <AlertDialogFooter className="flex space-x-2 justify-end">
                                <AlertDialogCancel
                                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    isDarkMode
                                      ? "bg-[#404040] hover:bg-[#505050] text-zinc-300"
                                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                  }`}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center transition-colors"
                                >
                                  {isDeleting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Group
                                    </>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return isLoading ? (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div
          className={`${
            isDarkMode ? "bg-[#262626]" : "bg-zinc-100"
          } rounded-2xl p-6 animate-pulse`}
        >
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton
              className={`w-64 h-8 mb-2 ${
                isDarkMode ? "bg-[#404040]" : "bg-zinc-200"
              }`}
            />
            <Skeleton
              className={`w-96 h-4 ${
                isDarkMode ? "bg-[#404040]" : "bg-zinc-200"
              }`}
            />
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Groups List Loader */}
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={i}
                  className={`w-full h-32 rounded-xl ${
                    isDarkMode ? "bg-[#404040]" : "bg-zinc-200"
                  }`}
                />
              ))}
            </div>

            {/* Group Creation Form Loader (Only for Admins) */}
            <div className="space-y-4">
              <Skeleton
                className={`w-full h-12 rounded-lg ${
                  isDarkMode ? "bg-[#404040]" : "bg-zinc-200"
                }`}
              />
              <Skeleton
                className={`w-full h-64 rounded-lg ${
                  isDarkMode ? "bg-[#404040]" : "bg-zinc-200"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Card
          className={`${
            isDarkMode ? "bg-[#262626]" : "bg-zinc-100"
          } border-0 shadow-none rounded-2xl transition-all`}
        >
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle
                  className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${
                    isDarkMode ? "text-zinc-200" : "text-zinc-800"
                  }`}
                >
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500" />
                  Group <span className="text-indigo-600">Management</span>
                </CardTitle>
                <CardDescription
                  className={`mt-2 text-sm sm:text-base ${
                    isDarkMode ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  Collaborate and improve together!
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {showAddMembers && selectedGroupId ? (
                  renderAddMembersDialog()
                ) : (
                  <>{renderGroupsList()}</>
                )}
              </div>
              {isAdmin && (
                <div className="space-y-4">{renderGroupCreationForm()}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedGroupManagement;
