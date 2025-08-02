import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { type Category } from "@shared/schema";

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export default function CategorySelector({ selectedCategories, onCategoriesChange }: CategorySelectorProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const toggleCategory = (categoryName: string) => {
    const isSelected = selectedCategories.includes(categoryName);
    if (isSelected) {
      onCategoriesChange(selectedCategories.filter(cat => cat !== categoryName));
    } else {
      onCategoriesChange([...selectedCategories, categoryName]);
    }
  };

  const clearCategories = () => {
    onCategoriesChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Available Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.name);
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCategory(category.name)}
              className={`h-8 text-xs ${
                isSelected 
                  ? "bg-primary text-white" 
                  : "border-gray-300 hover:border-primary"
              }`}
              style={isSelected ? { backgroundColor: category.color } : {}}
            >
              {category.name}
            </Button>
          );
        })}
        {categories.length === 0 && (
          <p className="text-sm text-gray-500">No categories available</p>
        )}
      </div>

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Selected:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCategories}
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedCategories.map((categoryName) => {
              const category = categories.find(cat => cat.name === categoryName);
              return (
                <Badge
                  key={categoryName}
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                  style={category ? { backgroundColor: category.color + '20', color: category.color } : {}}
                >
                  {categoryName}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-gray-700"
                    onClick={() => toggleCategory(categoryName)}
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
