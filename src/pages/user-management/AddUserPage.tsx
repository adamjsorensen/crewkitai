
import React from "react";
import { Card } from "@/components/ui/card";
import UserForm from "@/components/admin/users/UserForm";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const AddUserPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    toast({
      title: "User created",
      description: "The user has been successfully created."
    });
  };

  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Create New User</h3>
      <UserForm 
        onClose={() => {}} 
        onSuccess={handleSuccess} 
      />
    </>
  );
};

export default AddUserPage;
