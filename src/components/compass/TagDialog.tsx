
import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CompassTaskDisplay } from '@/types/compass';
import TagBadge from './TagBadge';
import { useCompassTagSelection } from '@/hooks/tasks/useCompassTagSelection';

interface TagDialogProps {
  task: CompassTaskDisplay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TagDialog: React.FC<TagDialogProps> = ({
  task,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { tags, isSubmitting, toggleTag, loadTags } = useCompassTagSelection();

  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open, loadTags]);

  const handleToggleTag = async (tagId: string) => {
    const isCurrentlyAssigned = task.tags?.some(t => t.id === tagId);
    const success = await toggleTag(task.id, tagId, !!isCurrentlyAssigned);
    
    if (success) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Manage Tags</DialogTitle>
          <DialogDescription>
            Add or remove tags to better organize your tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Task</h3>
            <p className="text-sm">{task.task_text}</p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-2">Task Tags:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {task.tags && task.tags.length > 0 ? (
                task.tags.map((tag) => (
                  <TagBadge 
                    key={tag.id}
                    name={tag.name} 
                    color={tag.color}
                    onRemove={() => handleToggleTag(tag.id)}
                  />
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags assigned</span>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-2">Available Tags:</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
              {tags
                .filter(tag => !task.tags?.some(t => t.id === tag.id))
                .map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent/50"
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    <TagBadge name={tag.name} color={tag.color} />
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              {tags.filter(tag => !task.tags?.some(t => t.id === tag.id)).length === 0 && (
                <p className="text-sm text-muted-foreground">No more tags available</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagDialog;
