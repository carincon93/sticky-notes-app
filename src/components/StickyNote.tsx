import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Trash } from "lucide-react";

const STORAGE_KEY = "canvas-objects";

type DragEndEvent = {
  delta: {
    x: number;
    y: number;
  };
  active: {
    id: string | number;
  };
};

type DragStartEvent = {
  active: {
    id: string | number;
  };
};

type Item = {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  description: string;
  color: string;
};

type DraggableItemProps = {
  id: string;
  item: Item;
  activeItem: Item | undefined;
  setItemSelected: React.Dispatch<React.SetStateAction<Item | null>>;
};

function DraggableItem({
  id,
  item,
  activeItem,
  setItemSelected,
}: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    position: "absolute" as const,
    backgroundColor: item.color,
    left: item.x,
    top: item.y,
    zIndex: item.zIndex,
    display: "flex",
    fontWeight: "bold",
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`bg-yellow-300 max-w-56 hover:opacity-80 transition-opacity w-full p-6 shadow-lg ${
        id == activeItem?.id ? "cursor-grabbing" : "hover:cursor-grab"
      }`}
      onDoubleClick={() => setItemSelected(item)}
      style={style}
    >
      <p className="whitespace-pre-line leading-4 text-xs">
        {item.description}
      </p>
    </div>
  );
}

type StickyNoteProps = {};

export const StickyNote = ({}: StickyNoteProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [itemSelected, setItemSelected] = useState<Item | null>(null);
  const [activeItem, setActiveItem] = useState<Item | undefined>(undefined);
  const [data, setData] = useState<{ description: string; color: string }>({
    description: "",
    color: "#ffdf20",
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  // Cargar objetos desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  // Guardar en localStorage cada vez que los items cambian
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    setData({ description: "", color: "#ffdf20" });
    setItemSelected(null);
    setOpenDialog(false);
  }, [items]);

  useEffect(() => {
    if (!itemSelected) return;

    setData({
      description: itemSelected.description,
      color: itemSelected.color,
    });
    setOpenDialog(true);
  }, [itemSelected]);

  const addItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setItems(items.filter((item) => item.id !== itemSelected?.id));

    const id = `item-${Date.now()}`;
    const newItem = {
      id,
      x: itemSelected?.x || 50,
      y: itemSelected?.y || 50,
      zIndex: itemSelected?.zIndex || items.length + 1,
      description: data.description,
      color: data.color,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragStart = (event: DragStartEvent): void => {
    const { active } = event;

    setActiveItem(items.find((item) => item.id === active.id));

    setItems((prevItems: Item[]) =>
      prevItems.map((item: Item) =>
        item.id === active.id
          ? {
              ...item,
              zIndex: prevItems.length,
            }
          : {
              ...item,
              zIndex: prevItems.length - 1,
            }
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { delta, active } = event;

    setActiveItem(undefined);

    setItems((prevItems: Item[]) =>
      prevItems.map((item: Item) =>
        item.id === active.id
          ? {
              ...item,
              x: item.x + delta.x,
              y: item.y + delta.y,
              zIndex: item.zIndex,
            }
          : item
      )
    );
  };

  return (
    <div className="w-screen relative bg-transparent">
      <div className="fixed bottom-4 flex items-center justify-center w-full">
        <Button
          variant="outline"
          className="mx-auto inline text-center"
          onClick={() => setOpenDialog(true)}
        >
          New sticky note
        </Button>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]" zIndex={items.length + 1}>
          <DialogHeader>
            <DialogTitle>Sticky Note</DialogTitle>
            <DialogDescription>
              Add your sticky note content and select a color. Double click on
              any note to edit it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addItem} id="form">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-left text-[12px]">
                  Text
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="description"
                    value={data.description}
                    required
                    onChange={(e) =>
                      setData({ ...data, description: e.target.value })
                    }
                  />
                  <small className="text-gray-400">Required</small>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-left text-[12px]">
                  Color
                </Label>
                <Input
                  id="color"
                  type="color"
                  className="col-span-3"
                  defaultValue={data?.color}
                  required
                  onChange={(e) => setData({ ...data, color: e.target.value })}
                />
              </div>
            </div>
          </form>
          <DialogFooter>
            {itemSelected && (
              <Button
                variant="outline"
                onClick={() => removeItem(itemSelected.id)}
              >
                <Trash color="red" />
              </Button>
            )}
            <Button form="form" type="submit">
              {!itemSelected ? "Add" : "Modify"}
            </Button>
          </DialogFooter>
          |
        </DialogContent>
      </Dialog>
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {items.map((item) => (
            <DraggableItem
              key={item.id}
              id={item.id}
              activeItem={activeItem}
              setItemSelected={setItemSelected}
              item={item}
            />
          ))}
        </DndContext>
      </div>

      <div className="md:hidden space-y-2 p-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-yellow-300 max-w-56 hover:opacity-80 transition-opacity w-full p-6 shadow-lg`}
            onClick={() => setItemSelected(item)}
          >
            <p className="whitespace-pre-line leading-4 text-xs">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
