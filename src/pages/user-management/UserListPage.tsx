
import React from "react";
import { useNavigate } from "react-router-dom";
import UserList from "@/components/admin/users/UserList";

const UserListPage = () => {
  const navigate = useNavigate();
  
  const handleViewUserDetails = (userId: string) => {
    navigate(`/dashboard/user-management/user-details/${userId}`);
  };

  return (
    <div>
      <UserList onViewUserDetails={handleViewUserDetails} />
    </div>
  );
};

export default UserListPage;
