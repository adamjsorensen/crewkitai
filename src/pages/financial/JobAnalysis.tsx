
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobs, getTransactions, createJob, updateJob, deleteJob } from "@/services/financialService";
import FinancialLayout from "@/components/financial/FinancialLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Job, Transaction } from "@/types/financial";
import { MoreHorizontal, Plus, Edit, Trash, FileSpreadsheet, Minus, DollarSign, LucideProps } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/financial/StatCard";
import { PieChart, ResponsiveContainer, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { forwardRef } from "react";

// Custom icon for Coins that matches Lucide icon structure
const Coins = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
        <path d="M7 6h1v4" />
        <path d="m16.71 13.88.7.71-2.82 2.82" />
      </svg>
    );
  }
);
Coins.displayName = "Coins";

const JobAnalysis = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [openJobDialog, setOpenJobDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newJob, setNewJob] = useState<{
    name: string;
    client_name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: "planned" | "in_progress" | "completed" | "cancelled";
  }>({
    name: "",
    client_name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "planned",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch jobs
  const {
    data: jobs = [],
    isLoading,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
  });

  // Fetch transactions for selected job
  const { data: transactions = [], refetch: refetchTransactions } = useQuery({
    queryKey: ["transactions", selectedJob?.id],
    queryFn: () => getTransactions({ job_id: selectedJob?.id }),
    enabled: !!selectedJob?.id,
  });

  const handleCreateJob = async () => {
    try {
      await createJob(newJob);
      toast.success("Job created successfully");
      setOpenJobDialog(false);
      setNewJob({
        name: "",
        client_name: "",
        description: "",
        start_date: "",
        end_date: "",
        status: "planned",
      });
      refetchJobs();
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("Failed to create job");
    }
  };

  const handleUpdateJob = async () => {
    if (!selectedJob) return;
    try {
      await updateJob(selectedJob.id, {
        name: newJob.name,
        client_name: newJob.client_name ? newJob.client_name : undefined,
        description: newJob.description ? newJob.description : undefined,
        start_date: newJob.start_date ? new Date(newJob.start_date).toISOString() : undefined,
        end_date: newJob.end_date ? new Date(newJob.end_date).toISOString() : undefined,
        status: newJob.status,
      });
      toast.success("Job updated successfully");
      setOpenJobDialog(false);
      refetchJobs();
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job");
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    try {
      await deleteJob(selectedJob.id);
      toast.success("Job deleted successfully");
      setOpenDeleteDialog(false);
      setSelectedJob(null);
      refetchJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };

  const openEditDialog = (job: Job) => {
    setSelectedJob(job);
    setNewJob({
      name: job.name,
      client_name: job.client_name || "",
      description: job.description || "",
      start_date: job.start_date || "",
      end_date: job.end_date || "",
      status: job.status,
    });
    setOpenJobDialog(true);
  };

  const openConfirmDelete = (job: Job) => {
    setSelectedJob(job);
    setOpenDeleteDialog(true);
  };

  const showJobDetails = (job: Job) => {
    setSelectedJob(job);
    refetchTransactions();
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.client_name && job.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Prepare chart data for selected job
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc: Record<string, number>, transaction) => {
      const category = transaction.category_name || "Uncategorized";
      acc[category] = (acc[category] || 0) + Number(transaction.amount);
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Calculate profit and margin
  const jobProfit = selectedJob ? selectedJob.total_revenue - selectedJob.total_expenses : 0;
  const jobMargin = selectedJob && selectedJob.total_revenue > 0
    ? (jobProfit / selectedJob.total_revenue) * 100
    : 0;

  return (
    <FinancialLayout title="Job Analysis">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-full md:w-96">
            <Input
              placeholder="Search jobs by name or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Dialog open={openJobDialog} onOpenChange={setOpenJobDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedJob ? "Edit Job" : "Add New Job"}</DialogTitle>
                <DialogDescription>
                  {selectedJob
                    ? "Update job details below"
                    : "Enter details for the new painting job"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name">Job Name *</label>
                  <Input
                    id="name"
                    value={newJob.name}
                    onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                    placeholder="Residential Exterior Painting"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="client">Client Name</label>
                  <Input
                    id="client"
                    value={newJob.client_name}
                    onChange={(e) => setNewJob({ ...newJob, client_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description">Description</label>
                  <Input
                    id="description"
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="2-story house, full exterior painting"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="start-date">Start Date</label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newJob.start_date}
                      onChange={(e) => setNewJob({ ...newJob, start_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="end-date">End Date</label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newJob.end_date}
                      onChange={(e) => setNewJob({ ...newJob, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newJob.status}
                    onChange={(e) => setNewJob({ ...newJob, status: e.target.value as "planned" | "in_progress" | "completed" | "cancelled" })}
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenJobDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={selectedJob ? handleUpdateJob : handleCreateJob}
                  disabled={!newJob.name}
                >
                  {selectedJob ? "Update Job" : "Create Job"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Job</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedJob?.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteJob}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>
                Select a job to view detailed financial analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-y-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          Loading jobs...
                        </TableCell>
                      </TableRow>
                    ) : filteredJobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          No jobs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredJobs.map((job) => (
                        <TableRow 
                          key={job.id}
                          className={`cursor-pointer ${selectedJob?.id === job.id ? 'bg-muted' : ''}`}
                          onClick={() => showJobDetails(job)}
                        >
                          <TableCell>
                            <div className="font-medium">{job.name}</div>
                            {job.client_name && (
                              <div className="text-sm text-muted-foreground">
                                {job.client_name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`
                                ${job.status === "completed" ? "border-green-500 text-green-600" : ""}
                                ${job.status === "in_progress" ? "border-blue-500 text-blue-600" : ""}
                                ${job.status === "planned" ? "border-amber-500 text-amber-600" : ""}
                                ${job.status === "cancelled" ? "border-red-500 text-red-600" : ""}
                              `}
                            >
                              {job.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(job);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  showJobDetails(job);
                                }}>
                                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openConfirmDelete(job);
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedJob ? `Job Analysis: ${selectedJob.name}` : "Select a job to view analysis"}
              </CardTitle>
              <CardDescription>
                {selectedJob
                  ? `${selectedJob.client_name ? `Client: ${selectedJob.client_name} | ` : ""}Status: ${selectedJob.status}`
                  : "Click on a job from the list to see detailed financial analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedJob ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                      title="Revenue"
                      value={selectedJob.total_revenue}
                      icon={DollarSign}
                      iconColor="text-green-500"
                    />
                    <StatCard
                      title="Expenses"
                      value={selectedJob.total_expenses}
                      icon={Minus}
                      iconColor="text-red-500"
                    />
                    <StatCard
                      title="Profit"
                      value={jobProfit}
                      description={`Margin: ${jobMargin.toFixed(1)}%`}
                      icon={Coins}
                      iconColor="text-blue-500"
                    />
                  </div>

                  <Tabs defaultValue="expenses">
                    <TabsList>
                      <TabsTrigger value="expenses">Expenses Breakdown</TabsTrigger>
                      <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="expenses">
                      {pieData.length > 0 ? (
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No expense data available for this job
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="transactions">
                      <div className="overflow-y-auto max-h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  No transactions found for this job
                                </TableCell>
                              </TableRow>
                            ) : (
                              transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell>
                                    {format(new Date(transaction.transaction_date), "MMM dd, yyyy")}
                                  </TableCell>
                                  <TableCell>
                                    {transaction.description || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {transaction.category_name || "Uncategorized"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={transaction.type === "income" ? "text-green-600 border-green-500" : "text-red-600 border-red-500"}
                                    >
                                      {transaction.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    }).format(transaction.amount)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Select a job from the list to view detailed analysis
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </FinancialLayout>
  );
};

export default JobAnalysis;
