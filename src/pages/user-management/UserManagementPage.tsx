
import React from "react";
import { Outlet } from "react-router-dom";
import UserManagementLayout from "@/components/user-management/UserManagementLayout";

const UserManagementPage = () => {
  return (
    <UserManagementLayout>
      <Outlet />
    </UserManagementLayout>
  );
};

export default UserManagementPage;
