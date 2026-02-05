import { useState, useEffect } from 'react';
import { useUpdateField } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Field } from '../backend';
import { PREDEFINED_ICONS, PREDEFINED_COLORS, getIconComponent, getColorById } from '../utils/fieldAppearance';
import { FIELD_CARD_BACKGROUNDS, getBackgroundById, getBackgroundCssVar, type BackgroundColorId } from '../utils/fieldCardBackgrounds';
import * as LucideIcons from 'lucide-react';

interface EditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: Field;
}

export default function EditFieldDialog({ open, onOpenChange, field }: EditFieldDialogProps) {
  const [name, setName] = useState(field.name);
  const [selectedIcon, setSelectedIcon] = useState<string>(field.icon);
  const [selectedColor, setSelectedColor] = useState<string>(field.color);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundColorId>(field.backgroundColor as BackgroundColorId);
  const updateField = useUpdateField();

  useEffect(() => {
    if (open) {
      setName(field.name);
      setSelectedIcon(field.icon);
      setSelectedColor(field.color);
      setSelectedBackground(field.backgroundColor as BackgroundColorId);
    }
  }, [open, field.name, field.icon, field.color, field.backgroundColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      updateField.mutate(
        { 
          fieldId: field.id, 
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
          backgroundColor: selectedBackground,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  const SelectedIconComponent = getIconComponent(selectedIcon);
  const selectedColorObj = getColorById(selectedColor);
  const selectedBackgroundObj = getBackgroundById(selectedBackground);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
          <DialogDescription>Update the field name, icon, color, and background.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Field Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-field-name">Field Name</Label>
              <Input
                id="edit-field-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter field name"
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-lg border-2"
                  style={{ borderColor: selectedColorObj.value }}
                >
                  <div style={{ color: selectedColorObj.value }}>
                    <SelectedIconComponent size={24} />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedIcon}
                </span>
              </div>
              <ScrollArea className="h-48 border rounded-lg p-3">
                <div className="grid grid-cols-8 gap-2">
                  {PREDEFINED_ICONS.map((iconName) => {
                    const IconComponent = (LucideIcons as any)[iconName];
                    const isSelected = selectedIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-md
                          transition-all hover:bg-accent
                          ${isSelected ? 'bg-accent ring-2 ring-primary' : 'bg-background'}
                        `}
                        title={iconName}
                      >
                        <IconComponent size={20} />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: selectedColorObj.value }}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedColorObj.label}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {PREDEFINED_COLORS.map((color) => {
                  const isSelected = selectedColor === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(color.id)}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-lg border-2
                        transition-all hover:border-primary/50
                        ${isSelected ? 'border-primary bg-accent' : 'border-border'}
                      `}
                      title={color.label}
                    >
                      <div 
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs">{color.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-8 h-8 rounded-md border-2 border-border"
                  style={{ backgroundColor: getBackgroundCssVar(selectedBackground) }}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedBackgroundObj.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {FIELD_CARD_BACKGROUNDS.map((bg) => {
                  const isSelected = selectedBackground === bg.id;
                  const bgColor = getBackgroundCssVar(bg.id);
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBackground(bg.id)}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-lg border-2
                        transition-all hover:border-primary/50
                        ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                      `}
                      title={bg.label}
                    >
                      <div 
                        className="w-full h-12 rounded-md border border-border"
                        style={{ backgroundColor: bgColor }}
                      />
                      <span className="text-xs text-center">{bg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || updateField.isPending}>
              {updateField.isPending ? 'Updating...' : 'Update Field'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
