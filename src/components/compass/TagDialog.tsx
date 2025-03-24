
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { CompassTaskDisplay, CompassTag } from '@/types/compass';
import { useToast } from '@/hooks/use-toast';
import { useCompassTags } from '@/hooks/useCompassTags';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { HexColorPicker } from 'react-colorful';
import { supabase } from '@/integrations/supabase/client';

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
  const { tags, addTag } = useCompassTags();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    task.tags ? task.tags.map(tag => tag.id) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#2563eb');
  const { toast } = useToast();

  const handleTagChange = (tagId: string, checked: boolean) => {
    if (checked) {
      setSelectedTags([...selectedTags, tagId]);
    } else {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    }
  };

  const handleSaveTags = async () => {
    setIsSubmitting(true);

    try {
      // First, remove all existing tag associations
      const { error: deleteError } = await supabase
        .from('compass_task_tags')
        .delete()
        .eq('task_id', task.id);

      if (deleteError) {
        console.error('Error removing existing tags:', deleteError);
        throw new Error('Failed to update tags');
      }

      // Then add new tag associations
      if (selectedTags.length > 0) {
        const tagRelations = selectedTags.map(tagId => ({
          task_id: task.id,
          tag_id: tagId,
          created_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('compass_task_tags')
          .insert(tagRelations);

        if (insertError) {
          console.error('Error adding new tags:', insertError);
          throw new Error('Failed to update tags');
        }
      }

      // Update the task's updated_at timestamp
      await supabase
        .from('compass_tasks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', task.id);

      toast({
        title: "Tags Updated",
        description: selectedTags.length > 0 
          ? `Task now has ${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'}.`
          : "All tags have been removed from this task.",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating tags:', err);
      toast({
        title: "Error",
        description: "Failed to update task tags.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a tag name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newTag = await addTag(newTagName, newTagColor);
      
      if (newTag) {
        setSelectedTags([...selectedTags, newTag.id]);
        setIsAddingNew(false);
        
        toast({
          title: "Tag Created",
          description: `The tag "${newTagName}" has been created and added to this task.`,
        });
      }
    } catch (err) {
      console.error('Error creating tag:', err);
      toast({
        title: "Error",
        description: "Failed to create new tag.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {task.tags && task.tags.length > 0 ? "Manage Tags" : "Add Tags"}
          </DialogTitle>
        </DialogHeader>
        
        {isAddingNew ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Tag Name</Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tag Color</Label>
              <HexColorPicker color={newTagColor} onChange={setNewTagColor} />
              <div className="flex items-center mt-2 gap-2">
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: newTagColor }}
                />
                <Input
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNewTag} disabled={isSubmitting || !newTagName.trim()}>
                {isSubmitting ? "Creating..." : "Create Tag"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="py-4">
              {tags.length > 0 ? (
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={tag.id} 
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => handleTagChange(tag.id, checked === true)}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <Label htmlFor={tag.id} className="cursor-pointer">{tag.name}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags available yet. Create your first tag below.</p>
              )}
              
              <Button 
                variant="ghost" 
                className="mt-4 text-sm"
                onClick={() => setIsAddingNew(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Tag
              </Button>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveTags} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TagDialog;
