
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SaveContentDialog from "./SaveContentDialog";

interface ContentHeaderProps {
  title: string;
  saveTitle: string;
  setSaveTitle: (title: string) => void;
  isSaving: boolean;
  isSaveDialogOpen: boolean;
  setIsSaveDialogOpen: (open: boolean) => void;
  handleCopyToClipboard: () => void;
  handleSaveContent: () => Promise<void>;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({
  title,
  saveTitle,
  setSaveTitle,
  isSaving,
  isSaveDialogOpen,
  setIsSaveDialogOpen,
  handleCopyToClipboard,
  handleSaveContent
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/content')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      
      <div className="flex gap-2 self-end sm:self-auto">
        <Button
          variant="outline"
          onClick={handleCopyToClipboard}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        
        <SaveContentDialog
          saveTitle={saveTitle}
          setSaveTitle={setSaveTitle}
          isSaving={isSaving}
          isSaveDialogOpen={isSaveDialogOpen}
          setIsSaveDialogOpen={setIsSaveDialogOpen}
          handleSaveContent={handleSaveContent}
        />
      </div>
    </div>
  );
};

export default ContentHeader;
