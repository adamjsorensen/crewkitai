
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Building2, User, Mail, PaintBucket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BusinessProfilePage = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: "",
    full_name: "",
    email: "",
    phone: "",
    business_address: "",
    website: "",
    company_description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
      return;
    }

    if (profile) {
      setFormData(prevData => ({
        ...prevData,
        company_name: profile.company_name || "",
        full_name: profile.full_name || "",
        email: user?.email || "",
        phone: profile.phone || "",
        business_address: profile.business_address || "",
        website: profile.website || "",
        company_description: profile.company_description || "",
      }));
    }
  }, [user, profile, isLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: formData.company_name,
          full_name: formData.full_name,
          phone: formData.phone,
          business_address: formData.business_address,
          website: formData.website,
          company_description: formData.company_description,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;
      
      toast.success("Business profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const companyInitials = formData.company_name
    ? formData.company_name
        .split(" ")
        .map(word => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "CO";

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
            <p className="text-muted-foreground">
              Manage your business information and details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Business Overview</CardTitle>
              <CardDescription>Your business at a glance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt={formData.company_name} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {companyInitials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{formData.company_name}</h3>
                <p className="text-sm text-muted-foreground">{formData.email}</p>
              </div>
              <div className="w-full space-y-2 pt-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Painting Company</span>
                </div>
                {formData.website && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formData.website}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formData.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formData.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Edit Business Profile</CardTitle>
              <CardDescription>Update your business information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Your Company Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Owner/Manager Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Your Full Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here. Please update from account settings.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your Phone Number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address">Business Address</Label>
                  <Input
                    id="business_address"
                    name="business_address"
                    value={formData.business_address}
                    onChange={handleChange}
                    placeholder="Your Business Address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.yourcompany.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_description">Company Description</Label>
                  <Textarea
                    id="company_description"
                    name="company_description"
                    value={formData.company_description}
                    onChange={handleChange}
                    placeholder="Tell us about your painting business..."
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessProfilePage;
