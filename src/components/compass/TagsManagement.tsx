
import React, { useState } from 'react';
import { PlusCircle, Trash2, Edit, Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCompassTags } from '@/hooks/useCompassTags';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import TagBadge from './TagBadge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker } from 'react-colorful';

const TagsManagement = () => {
  const { tags, isLoading, createTag, updateTag, deleteTag } = useCompassTags();
  const { toast } = useToast();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8B5CF6');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a tag name.",
        variant: "destructive",
      });
      return;
    }
    
    const success = await createTag(newTagName.trim(), newTagColor);
    if (success) {
      setNewTagName('');
      setNewTagColor('#8B5CF6');
    }
  };
  
  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingTag(id);
    setEditName(name);
    setEditColor(color);
  };
  
  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditName('');
    setEditColor('');
  };
  
  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Tag name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    const success = await updateTag(id, {
      name: editName.trim(),
      color: editColor
    });
    
    if (success) {
      handleCancelEdit();
    }
  };
  
  const handleDeleteTag = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tag? It will be removed from all tasks.')) {
      await deleteTag(id);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <span>Tags</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-10 p-0"
                style={{ backgroundColor: newTagColor }}
              >
                <span className="sr-only">Pick a color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <HexColorPicker color={newTagColor} onChange={setNewTagColor} />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={handleCreateTag} 
            variant="default" 
            size="sm"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        <Separator />
        
        {tags.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No tags yet. Create your first tag to label your tasks.
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div 
                key={tag.id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50"
              >
                {editingTag === tag.id ? (
                  <>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-10 p-0"
                            style={{ backgroundColor: editColor }}
                          >
                            <span className="sr-only">Pick a color</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <HexColorPicker color={editColor} onChange={setEditColor} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSaveEdit(tag.id)}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <TagBadge name={tag.name} color={tag.color} />
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleStartEdit(tag.id, tag.name, tag.color)}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TagsManagement;
