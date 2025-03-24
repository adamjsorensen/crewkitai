
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
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
import { useToast } from "@/hooks/use-toast";
import UserForm from "@/components/admin/users/UserForm";
import DeleteUserDialog from "@/components/admin/users/DeleteUserDialog";
import { User } from "@/types/user";
import { Search, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users with roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Fetching users...");
      
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        toast({
          title: "Error fetching users",
          description: profilesError.message,
          variant: "destructive",
        });
        return [];
      }

      console.log("Profiles fetched:", profiles);

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

      console.log("Users with roles:", usersWithRoles);
      return usersWithRoles;
    },
  });

  // Filter users based on search term
  const filteredUsers = users.filter((user: User) => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  // Handle delete user dialog
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  return (
    <AdminLayout activeTab="users">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.company_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role || 'user'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(user)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with specified details.
            </DialogDescription>
          </DialogHeader>
          <UserForm 
            onClose={() => setIsAddDialogOpen(false)} 
            onSuccess={() => {
              setIsAddDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["users"] });
              toast({
                title: "User created",
                description: "The user has been successfully created.",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details and role.
              </DialogDescription>
            </DialogHeader>
            <UserForm 
              user={editingUser}
              onClose={() => setEditingUser(null)} 
              onSuccess={() => {
                setEditingUser(null);
                queryClient.invalidateQueries({ queryKey: ["users"] });
                toast({
                  title: "User updated",
                  description: "The user has been successfully updated.",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Dialog */}
      {userToDelete && (
        <DeleteUserDialog
          user={userToDelete}
          open={!!userToDelete}
          onOpenChange={() => setUserToDelete(null)}
          onSuccess={() => {
            setUserToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast({
              title: "User deleted",
              description: "The user has been successfully deleted.",
            });
          }}
        />
      )}
    </AdminLayout>
  );
};

export default UsersPage;
