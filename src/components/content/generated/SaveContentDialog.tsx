
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface SaveContentDialogProps {
  saveTitle: string;
  setSaveTitle: (title: string) => void;
  isSaving: boolean;
  isSaveDialogOpen: boolean;
  setIsSaveDialogOpen: (open: boolean) => void;
  handleSaveContent: () => Promise<void>;
}

const SaveContentDialog: React.FC<SaveContentDialogProps> = ({
  saveTitle,
  setSaveTitle,
  isSaving,
  isSaveDialogOpen,
  setIsSaveDialogOpen,
  handleSaveContent
}) => {
  return (
    <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Content</DialogTitle>
          <DialogDescription>
            Give your content a title to save it for later use
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            value={saveTitle} 
            onChange={(e) => setSaveTitle(e.target.value)}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsSaveDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveContent}
            disabled={isSaving || !saveTitle.trim()}
          >
            {isSaving ? "Saving..." : "Save Content"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveContentDialog;
