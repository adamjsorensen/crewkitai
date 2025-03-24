
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText, DollarSign, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCompassTasks } from "@/hooks/useCompassTasks";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/financial/StatCard";

const DashboardHome = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Good day");
  const { activeTasks, completedTasks, isLoading: tasksLoading, hasOnboarded, loadTasks } = useCompassTasks();

  // Set appropriate greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    
    // Load tasks if user has onboarded
    if (hasOnboarded === true) {
      loadTasks();
    }
  }, [hasOnboarded, loadTasks]);

  // Stats for the dashboard
  const stats = [
    {
      title: "AI Coach",
      value: "24/7",
      description: "Access to personalized advice",
      icon: BrainCircuit,
      color: "text-blue-500",
    },
    {
      title: "Strategic Planner",
      value: hasOnboarded ? `${activeTasks.length}` : "Setup",
      description: hasOnboarded 
        ? `${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}` 
        : "Organize your priorities",
      icon: Calendar,
      color: "text-green-500",
    },
    {
      title: "Content Generator",
      value: "10+",
      description: "Templates available",
      icon: FileText,
      color: "text-amber-500",
    },
    {
      title: "Financial Clarity",
      value: "$0",
      description: "Start monitoring your finances",
      icon: DollarSign,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{greeting}, {profile?.full_name?.split(' ')[0] || 'Painter'}</h2>
        <p className="text-muted-foreground">
          {profile?.company_name 
            ? `Welcome to CrewkitAI, your painting business assistant for ${profile.company_name}.` 
            : "Welcome to CrewkitAI, your all-in-one platform for managing your painting business."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card 
            key={stat.title} 
            className="card-hover cursor-pointer transition-all hover:shadow-md"
            onClick={() => {
              if (stat.title === "AI Coach") navigate("/dashboard/ai-coach");
              else if (stat.title === "Strategic Planner") navigate("/dashboard/compass");
              else if (stat.title === "Content Generator") navigate("/dashboard/content");
              else if (stat.title === "Financial Clarity") navigate("/dashboard/financial");
            }}
          >
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

      {/* Priority Tasks Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Priority Tasks</span>
              <button 
                onClick={() => navigate("/dashboard/compass")}
                className="text-sm text-primary hover:underline flex items-center"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </CardTitle>
            <CardDescription>Your most important tasks from Strategic Compass</CardDescription>
          </CardHeader>
          <CardContent>
            {hasOnboarded === null ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : hasOnboarded === false ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You haven't set up Strategic Compass yet</p>
                <button 
                  onClick={() => navigate("/dashboard/compass")}
                  className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors mx-auto"
                >
                  <Calendar className="h-5 w-5" />
                  Set Up Strategic Compass
                </button>
              </div>
            ) : tasksLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You don't have any active tasks</p>
                <button 
                  onClick={() => navigate("/dashboard/compass")}
                  className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors mx-auto"
                >
                  <Calendar className="h-5 w-5" />
                  Create New Tasks
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer flex items-start gap-3"
                    onClick={() => navigate("/dashboard/compass")}
                  >
                    <div className={cn(
                      "h-2 w-2 rounded-full mt-2",
                      task.priority === "High" ? "bg-red-500" : 
                      task.priority === "Medium" ? "bg-amber-500" : 
                      "bg-green-500"
                    )} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.task_text}</p>
                      {task.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1">{task.reasoning}</p>
                      )}
                    </div>
                    {task.due_date && (
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                {activeTasks.length > 5 && (
                  <button 
                    onClick={() => navigate("/dashboard/compass")}
                    className="w-full text-center text-sm text-primary hover:underline flex items-center justify-center py-2"
                  >
                    View {activeTasks.length - 5} more tasks <ArrowRight className="h-3 w-3 ml-1" />
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button 
              onClick={() => navigate("/dashboard/ai-coach")}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors"
            >
              <BrainCircuit className="h-5 w-5" />
              Ask AI Coach a Question
            </button>
            <button 
              onClick={() => navigate("/dashboard/content")}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Generate New Content
            </button>
            <button 
              onClick={() => navigate("/dashboard/financial")}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors"
            >
              <DollarSign className="h-5 w-5" />
              Track a New Expense
            </button>
            <button 
              onClick={() => navigate("/dashboard/compass")}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="h-5 w-5" />
              Complete a Task
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
