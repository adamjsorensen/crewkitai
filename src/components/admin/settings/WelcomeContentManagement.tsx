
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type WelcomeContent = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  icon: string | null;
  icon_color: string | null;
  content: string | null;
  position: number | null;
};

const WelcomeContentManagement = () => {
  const [items, setItems] = useState<WelcomeContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WelcomeContent | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("feature");
  const [icon, setIcon] = useState("sparkles");
  const [iconColor, setIconColor] = useState("#6366F1");
  const [content, setContent] = useState("");
  
  useEffect(() => {
    fetchContent();
  }, []);
  
  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_coach_welcome_content")
        .select("*")
        .order("position", { ascending: true });
        
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching welcome content:", error);
      toast({
        title: "Error",
        description: "Failed to load welcome content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditItem = (item: WelcomeContent) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setType(item.type);
    setIcon(item.icon || "sparkles");
    setIconColor(item.icon_color || "#6366F1");
    setContent(item.content || "");
    setDialogOpen(true);
  };
  
  const handleAddItem = () => {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setType("feature");
    setIcon("sparkles");
    setIconColor("#6366F1");
    setContent("");
    setDialogOpen(true);
  };
  
  const handleSaveItem = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const newItem = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        icon,
        icon_color: iconColor,
        content: content.trim() || null,
        position: editingItem?.position || (Math.max(0, ...items.map(i => i.position || 0)) + 1),
      };
      
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("ai_coach_welcome_content")
          .update(newItem)
          .eq("id", editingItem.id);
          
        if (error) throw error;
        
        setItems(items.map(item => 
          item.id === editingItem.id ? { ...item, ...newItem } : item
        ));
        
        toast({
          title: "Success",
          description: "Welcome content updated successfully",
        });
      } else {
        // Add new item
        const { data, error } = await supabase
          .from("ai_coach_welcome_content")
          .insert(newItem)
          .select();
          
        if (error) throw error;
        
        setItems([...items, ...(data || [])]);
        
        toast({
          title: "Success",
          description: "Welcome content added successfully",
        });
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving welcome content:", error);
      toast({
        title: "Error",
        description: "Failed to save welcome content",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const { error } = await supabase
        .from("ai_coach_welcome_content")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      setItems(items.filter(item => item.id !== id));
      
      toast({
        title: "Success",
        description: "Welcome content deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting welcome content:", error);
      toast({
        title: "Error",
        description: "Failed to delete welcome content",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <h3 className="text-lg font-medium">Welcome Content</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size={isMobile ? "sm" : "default"} className="h-8 sm:h-10" onClick={handleAddItem}>
              <Plus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add Item</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Content Item" : "Add Content Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="example">Example</SelectItem>
                      <SelectItem value="tip">Tip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon</label>
                  <Input 
                    value={icon} 
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Lucide icon name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon Color</label>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="color"
                    value={iconColor} 
                    onChange={(e) => setIconColor(e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input 
                    value={iconColor} 
                    onChange={(e) => setIconColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Additional content (optional)"
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No welcome content found. Add an item to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="border overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row justify-between">
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: item.icon_color || '#6366F1' }}
                      >
                        <span className="text-white text-xs">
                          {item.icon && item.icon.substring(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-medium">{item.title}</h4>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full">
                        {item.type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    )}
                    {item.content && !isMobile && (
                      <div className="mt-2 text-sm overflow-hidden text-ellipsis whitespace-nowrap max-w-[400px]">
                        {item.content}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WelcomeContentManagement;
