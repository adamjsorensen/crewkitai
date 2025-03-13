
import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFinancialStatements,
  uploadFinancialDocument,
  createTransaction,
  getCategories,
  getJobs,
} from "@/services/financialService";
import FinancialLayout from "@/components/financial/FinancialLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FinancialStatement, FinancialCategory, Job, Transaction } from "@/types/financial";
import { format, parse } from "date-fns";
import { FileUp, Download, Check, AlertCircle, UploadCloud, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Papa from "papaparse";

const DataUpload = () => {
  const queryClient = useQueryClient();
  const [uploadType, setUploadType] = useState<"sales" | "expenses" | "bank">("expenses");
  const [isUploading, setIsUploading] = useState(false);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch financial statements
  const { data: statements = [] } = useQuery({
    queryKey: ["financialStatements"],
    queryFn: getFinancialStatements,
  });

  // Fetch categories for mapping
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Fetch jobs for mapping
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
  });

  // Mutation for uploading
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFinancialDocument(file, uploadType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financialStatements"] });
      toast.success("File uploaded successfully");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    },
  });

  // Mutation for creating transactions
  const transactionMutation = useMutation({
    mutationFn: (transaction: Omit<Transaction, "id" | "created_at" | "updated_at" | "category_name" | "job_name">) => 
      createTransaction(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Transactions imported successfully");
      setCsvData(null);
      setMappings({});
    },
    onError: (error) => {
      console.error("Transaction import error:", error);
      toast.error("Failed to import transactions");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data);
          
          // Initialize default mappings based on column names
          const defaultMappings: Record<string, string> = {};
          const headers = Object.keys(results.data[0]);
          
          // Try to guess mappings based on common field names
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('date')) {
              defaultMappings['transaction_date'] = header;
            } else if (lowerHeader.includes('amount') || lowerHeader.includes('price')) {
              defaultMappings['amount'] = header;
            } else if (lowerHeader.includes('desc')) {
              defaultMappings['description'] = header;
            } else if (lowerHeader.includes('categor')) {
              defaultMappings['category'] = header;
            } else if (lowerHeader.includes('job') || lowerHeader.includes('project')) {
              defaultMappings['job'] = header;
            }
          });
          
          setMappings(defaultMappings);
        } else {
          toast.error("The CSV file is empty or invalid");
        }
        setIsUploading(false);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast.error("Failed to parse CSV file");
        setIsUploading(false);
      }
    });

    // Also upload the file to storage
    uploadMutation.mutate(file);
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImportTransactions = async () => {
    if (!csvData || csvData.length === 0 || !mappings.transaction_date || !mappings.amount) {
      toast.error("Please map required fields (Date and Amount)");
      return;
    }

    try {
      // Process each row and create transactions
      const transactions = csvData.map((row) => {
        let amount = parseFloat(row[mappings.amount]);
        if (isNaN(amount)) {
          // Try to clean the amount string and parse again
          const cleanAmount = row[mappings.amount].replace(/[^0-9.-]+/g, "");
          amount = parseFloat(cleanAmount);
          if (isNaN(amount)) {
            throw new Error(`Invalid amount in row: ${JSON.stringify(row)}`);
          }
        }

        // Handle negative amounts (expenses) vs positive (income)
        const transactionType = uploadType === "sales" ? "income" : 
                               uploadType === "expenses" ? "expense" :
                               (amount < 0 ? "expense" : "income");
        
        // For bank statements, ensure amount is positive
        if (uploadType === "bank" && amount < 0) {
          amount = Math.abs(amount);
        }

        // Try to parse date
        let transactionDate: string;
        try {
          // Try different date formats
          const dateValue = row[mappings.transaction_date];
          let parsedDate: Date;
          
          // Try common formats
          const formats = [
            "yyyy-MM-dd",
            "MM/dd/yyyy",
            "dd/MM/yyyy",
            "MM-dd-yyyy",
            "dd-MM-yyyy",
            "yyyy/MM/dd"
          ];
          
          let success = false;
          for (const fmt of formats) {
            try {
              parsedDate = parse(dateValue, fmt, new Date());
              if (!isNaN(parsedDate.getTime())) {
                success = true;
                break;
              }
            } catch {
              // Continue to next format
            }
          }
          
          if (!success) {
            // Last resort: try JavaScript Date parsing
            parsedDate = new Date(dateValue);
            if (isNaN(parsedDate.getTime())) {
              throw new Error(`Could not parse date: ${dateValue}`);
            }
          }
          
          transactionDate = format(parsedDate, "yyyy-MM-dd");
        } catch (error) {
          console.error("Date parsing error:", error);
          // Fallback to today's date
          transactionDate = format(new Date(), "yyyy-MM-dd");
        }

        // Look up category ID if category mapping exists
        let categoryId: string | undefined = undefined;
        if (mappings.category && row[mappings.category]) {
          const categoryName = row[mappings.category];
          const foundCategory = categories.find(
            (c) => c.name.toLowerCase() === categoryName.toLowerCase()
          );
          categoryId = foundCategory?.id;
        }

        // Look up job ID if job mapping exists
        let jobId: string | undefined = undefined;
        if (mappings.job && row[mappings.job]) {
          const jobName = row[mappings.job];
          const foundJob = jobs.find(
            (j) => j.name.toLowerCase() === jobName.toLowerCase()
          );
          jobId = foundJob?.id;
        }

        return {
          transaction_date: transactionDate,
          amount,
          description: mappings.description ? row[mappings.description] : "",
          type: transactionType as "income" | "expense",
          category_id: categoryId,
          job_id: jobId,
        };
      });

      // Create transactions in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        await Promise.all(batch.map(transaction => transactionMutation.mutateAsync(transaction)));
      }

      toast.success(`Successfully imported ${transactions.length} transactions`);
      setCsvData(null);
      setMappings({});
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import transactions: " + (error as Error).message);
    }
  };

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let sampleData: string[] = [];

    if (uploadType === "sales") {
      headers = ["Date", "Client", "JobName", "Description", "Amount", "Category"];
      sampleData = ["2023-09-15", "John Smith", "Residential Project", "Interior Painting", "1500.00", "Residential Jobs"];
    } else if (uploadType === "expenses") {
      headers = ["Date", "Vendor", "JobName", "Description", "Amount", "Category"];
      sampleData = ["2023-09-10", "Paint Supply Co", "Residential Project", "Paint Materials", "450.00", "Paint Materials"];
    } else {
      headers = ["Date", "Description", "Amount", "Category"];
      sampleData = ["2023-09-05", "Paint Supply Co Payment", "-450.00", "Paint Materials"];
    }

    const csvContent = [
      headers.join(","),
      sampleData.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${uploadType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <FinancialLayout title="Upload Financial Data">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Transactions</CardTitle>
            <CardDescription>
              Upload CSV files to import your painting business transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Data Type</label>
                <Select
                  value={uploadType}
                  onValueChange={(value) => setUploadType(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales/Income</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                    <SelectItem value="bank">Bank Statements</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadType === "sales"
                    ? "Import your painting job revenue and payments received"
                    : uploadType === "expenses"
                    ? "Import your business expenses, materials, and other costs"
                    : "Import full bank statements with both income and expenses"}
                </p>
              </div>

              <div className="border rounded-lg p-8 bg-muted/50 flex flex-col items-center justify-center gap-4">
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-medium">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag and drop or click to browse
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button onClick={handleUpload} disabled={isUploading}>
                    <FileUp className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload CSV"}
                  </Button>
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {csvData && csvData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Map CSV Columns</CardTitle>
              <CardDescription>
                Match your CSV columns to the correct transaction fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <Select
                      value={mappings.transaction_date || ""}
                      onValueChange={(value) => setMappings({ ...mappings, transaction_date: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvData.length > 0 &&
                          Object.keys(csvData[0]).map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount *</label>
                    <Select
                      value={mappings.amount || ""}
                      onValueChange={(value) => setMappings({ ...mappings, amount: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select amount column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvData.length > 0 &&
                          Object.keys(csvData[0]).map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Select
                      value={mappings.description || ""}
                      onValueChange={(value) => setMappings({ ...mappings, description: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select description column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not selected</SelectItem>
                        {csvData.length > 0 &&
                          Object.keys(csvData[0]).map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={mappings.category || ""}
                      onValueChange={(value) => setMappings({ ...mappings, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not selected</SelectItem>
                        {csvData.length > 0 &&
                          Object.keys(csvData[0]).map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Job/Project</label>
                    <Select
                      value={mappings.job || ""}
                      onValueChange={(value) => setMappings({ ...mappings, job: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not selected</SelectItem>
                        {csvData.length > 0 &&
                          Object.keys(csvData[0]).map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-medium">Preview (First 5 Rows)</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {csvData.length > 0 &&
                            Object.keys(csvData[0]).map((column) => (
                              <TableHead key={column}>{column}</TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((cell, j) => (
                              <TableCell key={j}>{String(cell)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                {csvData.length} rows found in CSV
              </p>
              <Button onClick={handleImportTransactions}>
                Import Transactions
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upload History</CardTitle>
            <CardDescription>
              View previously uploaded financial documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No uploads found
                    </TableCell>
                  </TableRow>
                ) : (
                  statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        {statement.filename}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {statement.statement_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(statement.upload_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {statement.processed ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" />
                            <span>Processed</span>
                          </div>
                        ) : (
                          statement.error_message ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span>Error: {statement.error_message}</span>
                            </div>
                          ) : (
                            <span className="text-amber-600">Pending</span>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </FinancialLayout>
  );
};

export default DataUpload;
