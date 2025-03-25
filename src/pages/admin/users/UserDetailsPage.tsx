
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCog, ChevronLeft, Shield, History, FileCog, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const UserDetailsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      // Get the user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // Get the user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) throw roleError;

      // Return combined user data
      return {
        ...profile,
        role: roleData?.role || "user"
      } as User;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>User not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and user header */}
      <div className="flex flex-col gap-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-fit gap-1"
          onClick={() => navigate("/dashboard/admin/users/user-list")}
        >
          <ChevronLeft className="h-4 w-4" /> Back to users
        </Button>

        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user.full_name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {user.email} · 
              <span className="font-medium capitalize ml-1">{user.role || "user"}</span>
              {user.role === "admin" && <Shield className="h-3 w-3 text-primary ml-1" />}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs for different user information sections */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <UserCog className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1.5">
            <FileCog className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h4>
                <p>{user.full_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                <p>{user.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Company</h4>
                <p>{user.company_name || "—"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Role</h4>
                <p className="capitalize">{user.role || "user"}</p>
              </div>
              {user.phone && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                  <p>{user.phone}</p>
                </div>
              )}
              {user.website && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Website</h4>
                  <p>{user.website}</p>
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
              {user.company_description || user.business_address ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.business_address && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Business Address</h4>
                      <p>{user.business_address}</p>
                    </div>
                  )}
                  {user.company_description && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Company Description</h4>
                      <p>{user.company_description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No business information provided.</p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t flex justify-end gap-2">
              <Button variant="outline">Reset Password</Button>
              <Button>Edit User</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                Activity logging will be implemented in Phase 2 of the admin console development.
              </AlertDescription>
            </Alert>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                Content management will be implemented in Phase 2 of the admin console development.
              </AlertDescription>
            </Alert>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                Billing management will be implemented in Phase 2 of the admin console development.
              </AlertDescription>
            </Alert>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDetailsPage;
