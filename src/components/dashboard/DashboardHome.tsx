
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCompassTasks } from "@/hooks/useCompassTasks";
import { Skeleton } from "@/components/ui/skeleton";
import RecentChats from "@/components/pg-coach/RecentChats";

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

  return (
    <div className="space-y-8">
      {/* Hero Section with Personalized Welcome */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">{greeting}, {profile?.full_name?.split(' ')[0] || 'Painter'}</h2>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          {profile?.company_name 
            ? `Welcome to CrewkitAI, your painting business assistant for ${profile.company_name}.` 
            : "Welcome to CrewkitAI, your all-in-one platform for managing your painting business."}
        </p>
      </div>

      {/* Main Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        {/* Priority Tasks Section */}
        <Card className="overflow-hidden border-blue-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent border-b border-blue-100 pb-4">
            <CardTitle className="flex items-center justify-between text-xl">
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
          <CardContent className="p-5">
            {hasOnboarded === null ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : hasOnboarded === false ? (
              <div className="text-center py-8">
                <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="h-8 w-8 text-primary opacity-80" />
                </div>
                <p className="text-muted-foreground mb-4">You haven't set up Strategic Compass yet</p>
                <button 
                  onClick={() => navigate("/dashboard/compass")}
                  className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors mx-auto"
                >
                  <ArrowRight className="h-5 w-5" />
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
              <div className="text-center py-8">
                <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="h-8 w-8 text-primary opacity-80" />
                </div>
                <p className="text-muted-foreground mb-4">You don't have any active tasks</p>
                <button 
                  onClick={() => navigate("/dashboard/compass")}
                  className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors mx-auto"
                >
                  <ArrowRight className="h-5 w-5" />
                  Create New Tasks
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id} 
                    className="p-4 border border-blue-100 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer flex items-start gap-3 shadow-sm"
                    onClick={() => navigate("/dashboard/compass")}
                  >
                    <div className={cn(
                      "h-3 w-3 rounded-full mt-1.5 flex-shrink-0",
                      task.priority === "High" ? "bg-red-500" : 
                      task.priority === "Medium" ? "bg-amber-500" : 
                      "bg-green-500"
                    )} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.task_text}</p>
                      {task.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1">{task.reasoning}</p>
                      )}
                      {task.due_date && (
                        <div className="text-xs text-muted-foreground mt-1.5 bg-blue-50 inline-block px-2 py-0.5 rounded-full">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
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

        {/* Update RecentChats component reference */}
        <RecentChats />
      </div>
    </div>
  );
};

export default DashboardHome;
