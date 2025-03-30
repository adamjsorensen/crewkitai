
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
import { ParameterTweak, PromptParameter, useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EditTweakDialog from "./EditTweakDialog";
import { Card } from "@/components/ui/card";

type TweaksTableProps = {
  tweaks: ParameterTweak[];
  parameters: PromptParameter[];
  isLoading: boolean;
};

const TweaksTable = ({ tweaks, parameters, isLoading }: TweaksTableProps) => {
  const { toast } = useToast();
  const { deleteParameterTweak } = useCrewkitPromptParameters();
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; tweak: ParameterTweak | null }>({
    open: false,
    tweak: null,
  });
  const [editTweak, setEditTweak] = useState<ParameterTweak | null>(null);

  const handleDeleteClick = (tweak: ParameterTweak) => {
    setDeleteConfirm({ open: true, tweak });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.tweak) {
      deleteParameterTweak.mutate(deleteConfirm.tweak.id, {
        onSuccess: () => {
          toast({
            title: "Parameter tweak deleted",
            description: `Parameter tweak "${deleteConfirm.tweak?.name}" has been deleted.`,
          });
        },
      });
    }
    setDeleteConfirm({ open: false, tweak: null });
  };

  const handleEditClick = (tweak: ParameterTweak) => {
    setEditTweak(tweak);
  };

  const getParameterName = (parameterId: string | null) => {
    if (!parameterId) return "—";
    const parameter = parameters.find(p => p.id === parameterId);
    return parameter ? parameter.name : "Unknown";
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

  if (tweaks.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No parameter tweaks found. Create your first tweak to get started.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead className="w-[150px]">Parameter</TableHead>
              <TableHead>Sub-prompt</TableHead>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tweaks.map((tweak) => (
              <TableRow key={tweak.id}>
                <TableCell className="font-medium">{tweak.name}</TableCell>
                <TableCell>{getParameterName(tweak.parameter_id)}</TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate">
                    {tweak.sub_prompt}
                  </div>
                </TableCell>
                <TableCell>{tweak.order}</TableCell>
                <TableCell>
                  <Badge variant={tweak.active ? "default" : "secondary"}>
                    {tweak.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(tweak)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteClick(tweak)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-4">
        {tweaks.map((tweak) => (
          <Card key={tweak.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{tweak.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Parameter: {getParameterName(tweak.parameter_id)}
                </p>
              </div>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditClick(tweak)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDeleteClick(tweak)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm mt-2 border-t pt-2">
              <div className="line-clamp-2 text-muted-foreground">
                {tweak.sub_prompt}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3 items-center">
              <div className="text-sm mr-2">
                Order: {tweak.order}
              </div>
              
              <Badge variant={tweak.active ? "default" : "secondary"}>
                {tweak.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the parameter tweak "{deleteConfirm.tweak?.name}". This action cannot be undone.
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

      {editTweak && (
        <EditTweakDialog
          tweak={editTweak}
          parameters={parameters}
          open={!!editTweak}
          onOpenChange={(open) => !open && setEditTweak(null)}
        />
      )}
    </>
  );
};

export default TweaksTable;
