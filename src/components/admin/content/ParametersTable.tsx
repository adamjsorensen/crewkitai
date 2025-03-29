
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
import { ParameterWithTweaks, useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EditParameterDialog from "./EditParameterDialog";

type ParametersTableProps = {
  parameters: ParameterWithTweaks[];
  isLoading: boolean;
};

const ParametersTable = ({ parameters, isLoading }: ParametersTableProps) => {
  const { toast } = useToast();
  const { deleteParameter } = useCrewkitPromptParameters();
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; parameter: ParameterWithTweaks | null }>({
    open: false,
    parameter: null,
  });
  const [editParameter, setEditParameter] = useState<ParameterWithTweaks | null>(null);

  const handleDeleteClick = (parameter: ParameterWithTweaks) => {
    setDeleteConfirm({ open: true, parameter });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.parameter) {
      deleteParameter.mutate(deleteConfirm.parameter.id, {
        onSuccess: () => {
          toast({
            title: "Parameter deleted",
            description: `Parameter "${deleteConfirm.parameter?.name}" has been deleted.`,
          });
        },
      });
    }
    setDeleteConfirm({ open: false, parameter: null });
  };

  const handleEditClick = (parameter: ParameterWithTweaks) => {
    setEditParameter(parameter);
  };

  const getParameterTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      tone_and_style: "Tone & Style",
      audience: "Audience",
      length: "Length",
      focus: "Focus",
      format: "Format",
      custom: "Custom"
    };
    return typeMap[type] || type;
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
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead className="w-[150px]">Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Tweaks</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters.map((parameter) => (
              <TableRow key={parameter.id}>
                <TableCell className="font-medium">{parameter.name}</TableCell>
                <TableCell>{getParameterTypeLabel(parameter.type)}</TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate">
                    {parameter.description || "—"}
                  </div>
                </TableCell>
                <TableCell>{parameter.tweaks?.length || 0}</TableCell>
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
              This will delete the parameter "{deleteConfirm.parameter?.name}" and all associated tweaks. This action cannot be undone.
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
          onOpenChange={(open) => {
            if (!open) setEditParameter(null);
          }}
        />
      )}
    </>
  );
};

export default ParametersTable;
