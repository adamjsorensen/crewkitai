
import React from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { UserX } from "lucide-react";

interface DeleteUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DeleteUserDialog = ({
  user,
  open,
  onOpenChange,
  onSuccess,
}: DeleteUserDialogProps) => {
  const { toast } = useToast();

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      // Delete from profiles table
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteConfirm = () => {
    deleteUserMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex flex-col items-center">
          <div className="bg-destructive/10 p-3 rounded-full mb-3">
            <UserX className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription className="text-center mt-2">
            Are you sure you want to delete <strong>{user.full_name}</strong>?
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? (
              <span className="flex items-center">
                <span className="mr-2 size-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                Deleting...
              </span>
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserDialog;
