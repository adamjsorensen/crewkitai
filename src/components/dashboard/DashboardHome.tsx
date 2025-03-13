
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText, DollarSign, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const DashboardHome = () => {
  const stats = [
    {
      title: "AI Coach",
      value: "24/7",
      description: "Access to personalized advice",
      icon: BrainCircuit,
      color: "text-blue-500",
    },
    {
      title: "Content Generator",
      value: "10+",
      description: "Templates available",
      icon: FileText,
      color: "text-green-500",
    },
    {
      title: "Financial Clarity",
      value: "$0",
      description: "Start monitoring your finances",
      icon: DollarSign,
      color: "text-amber-500",
    },
    {
      title: "Team Management",
      value: "Easy",
      description: "Manage your painting crew",
      icon: Users,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Welcome to CrewkitAI, your all-in-one platform for managing your painting business.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors">
              <BrainCircuit className="h-5 w-5" />
              Ask AI Coach a Question
            </button>
            <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors">
              <FileText className="h-5 w-5" />
              Generate New Content
            </button>
            <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors">
              <DollarSign className="h-5 w-5" />
              Track a New Expense
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions with CrewkitAI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-center text-muted-foreground py-8">
                Your activity will appear here as you use the platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
