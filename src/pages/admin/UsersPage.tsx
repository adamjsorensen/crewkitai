
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import UserForm from "@/components/admin/users/UserForm";
import DeleteUserDialog from "@/components/admin/users/DeleteUserDialog";
import { User } from "@/types/user";
import { Search, UserPlus } from "lucide-react";

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("full_name");

      if (error) {
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      return data;
    },
  });

  // Filter users based on search term
  const filteredUsers = users.filter((user: any) => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.company_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.user_roles && user.user_roles.length > 0 
                          ? user.user_roles.map((role: any) => role.role).join(', ')
                          : 'user'}
                      </TableCell>
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
