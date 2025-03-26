
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import DeleteUserDialog from "@/components/admin/users/DeleteUserDialog";
import { User } from "@/types/user";
import { Search, UserPlus, MoreHorizontal, PencilLine, Trash2, ExternalLink, FilterX, Download, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useLogActivity } from "@/hooks/useLogActivity";

interface UserListProps {
  onViewUserDetails: (userId: string) => void;
}

const UserList = ({ onViewUserDetails }: UserListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useLogActivity();

  // Fetch users with roles
  const { data, isLoading } = useQuery({
    queryKey: ["users", { page, pageSize, roleFilter }],
    queryFn: async () => {
      console.log("Fetching users...");
      
      let query = supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      
      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);
      
      const { data: profiles, error: profilesError, count } = await query;

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        toast({
          title: "Error fetching users",
          description: profilesError.message,
          variant: "destructive",
        });
        return { users: [], totalCount: 0 };
      }

      // For each profile, get their role from user_roles
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          if (roleError) {
            console.error(`Error fetching role for user ${profile.id}:`, roleError);
          }

          // Transform to match our User type
          return {
            id: profile.id,
            full_name: profile.full_name || "",
            company_name: profile.company_name || "",
            email: profile.email || "",
            role: roleData?.role || "user" // Default to 'user' if no role found
          } as User;
        })
      );

      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("Error counting profiles:", countError);
      }

      return { 
        users: usersWithRoles, 
        totalCount: totalCount || 0 
      };
    },
  });

  const users = data?.users || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Filter users based on search term and role filter
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === "all" || 
      (roleFilter === "admin" && user.role === "admin") ||
      (roleFilter === "user" && user.role === "user");
    
    return matchesSearch && matchesRole;
  });

  // Handle delete user dialog
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle individual user checkbox
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Bulk delete selected users
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      try {
        // Note: This will cascade delete from auth.users to profiles due to DB constraints
        const { error } = await supabase.auth.admin.deleteUsers(selectedUsers);

        if (error) throw error;

        // Log activity
        await logActivity({
          actionType: 'bulk_delete_users',
          actionDetails: { count: selectedUsers.length, userIds: selectedUsers }
        });

        toast({
          title: "Users deleted",
          description: `Successfully deleted ${selectedUsers.length} users.`,
        });

        setSelectedUsers([]);
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } catch (error) {
        console.error("Error deleting users:", error);
        toast({
          title: "Error deleting users",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  // Export selected users as CSV
  const handleExportUsers = () => {
    const usersToExport = selectedUsers.length > 0
      ? filteredUsers.filter(user => selectedUsers.includes(user.id))
      : filteredUsers;

    if (usersToExport.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to export.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ["Full Name", "Email", "Company", "Role"];
    const csvRows = [
      headers.join(","),
      ...usersToExport.map(user => [
        `"${user.full_name || ''}"`,
        `"${user.email || ''}"`,
        `"${user.company_name || ''}"`,
        `"${user.role || 'user'}"`,
      ].join(","))
    ];
    const csvContent = csvRows.join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log activity
    logActivity({
      actionType: 'export_users',
      actionDetails: { count: usersToExport.length }
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleResetFilters}
            title="Reset filters"
          >
            <FilterX className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <span className="text-sm font-medium">{selectedUsers.length} selected</span>
          <div className="flex-1"></div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExportUsers}
            className="flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all users"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="pr-0">
                      <Checkbox 
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        aria-label={`Select ${user.full_name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.full_name}
                        {user.role === "admin" && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.company_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role || 'user'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onViewUserDetails(user.id)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PencilLine className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCog className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} users
                </p>
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      aria-disabled={page === 1}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    
                    // Logic for showing the correct page numbers
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                      if (i === 4) return (
                        <PaginationItem key="ellipsis-end">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                      if (i === 0) return (
                        <PaginationItem key="ellipsis-start">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else {
                      if (i === 0) return (
                        <PaginationItem key="ellipsis-start">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                      if (i === 4) return (
                        <PaginationItem key="ellipsis-end">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                      pageNum = page - 1 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={page === pageNum}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      aria-disabled={page === totalPages}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      )}

      {/* Delete User Dialog */}
      {userToDelete && (
        <DeleteUserDialog
          user={userToDelete}
          open={!!userToDelete}
          onOpenChange={() => setUserToDelete(null)}
          onSuccess={() => {
            // Log this activity
            logActivity({
              actionType: 'delete_user',
              actionDetails: { 
                user_email: userToDelete.email,
                user_name: userToDelete.full_name
              },
              affectedUserId: userToDelete.id,
              affectedResourceType: 'user'
            });
            
            setUserToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast({
              title: "User deleted",
              description: "The user has been successfully deleted.",
            });
          }}
        />
      )}
    </div>
  );
};

export default UserList;
