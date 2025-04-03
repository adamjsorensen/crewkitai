
import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { PromptParameter, useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EditParameterDialog from "./EditParameterDialog";

// Add this at the top level of the file to access it from useParameterMutations.ts
declare global {
  var globalCacheVersion: number;
}

// Initialize if not already defined
if (typeof globalCacheVersion === 'undefined') {
  globalThis.globalCacheVersion = 1;
}

type ParametersTableProps = {
  parameters: PromptParameter[];
  isLoading: boolean;
};

const parameterTypeLabels: Record<string, { label: string; variant: "default" | "outline" | "secondary" }> = {
  tone_and_style: { label: "Tone & Style", variant: "default" },
  audience: { label: "Audience", variant: "secondary" },
  length: { label: "Length", variant: "outline" },
  focus: { label: "Focus", variant: "secondary" },
  format: { label: "Format", variant: "default" },
  custom: { label: "Custom", variant: "outline" },
};

const ParametersTable = ({ parameters, isLoading }: ParametersTableProps) => {
  const { toast } = useToast();
  const { deleteParameter } = useCrewkitPromptParameters();
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; parameter: PromptParameter | null }>({
    open: false,
    parameter: null,
  });
  const [editParameter, setEditParameter] = useState<PromptParameter | null>(null);

  const handleDeleteClick = (parameter: PromptParameter) => {
    setDeleteConfirm({ open: true, parameter });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.parameter) {
      try {
        await deleteParameter.mutateAsync(deleteConfirm.parameter.id, {
          onSuccess: () => {
            // Increment global cache version to force refresh
            globalCacheVersion++;
            
            toast({
              title: "Parameter deleted",
              description: `Parameter "${deleteConfirm.parameter?.name}" has been deleted.`,
            });
          },
        });
        
        // Force a page reload after a short delay
        // This ensures all components will re-fetch with the latest data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("Error deleting parameter:", error);
      }
    }
    setDeleteConfirm({ open: false, parameter: null });
  };

  const handleEditClick = (parameter: PromptParameter) => {
    setEditParameter(parameter);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (parameters.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No parameters found. Create your first parameter to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[150px]">Type</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters.map((parameter) => (
              <TableRow key={parameter.id}>
                <TableCell className="font-medium">{parameter.name}</TableCell>
                <TableCell>{parameter.description || "—"}</TableCell>
                <TableCell>
                  {parameter.type in parameterTypeLabels ? (
                    <Badge variant={parameterTypeLabels[parameter.type].variant}>
                      {parameterTypeLabels[parameter.type].label}
                    </Badge>
                  ) : (
                    parameter.type
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={parameter.active ? "default" : "secondary"}>
                    {parameter.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(parameter)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteClick(parameter)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the parameter "{deleteConfirm.parameter?.name}". This action cannot be undone,
              and all associated tweaks and rules will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editParameter && (
        <EditParameterDialog
          parameter={editParameter}
          open={!!editParameter}
          onOpenChange={(open) => !open && setEditParameter(null)}
        />
      )}
    </>
  );
};

export default ParametersTable;
