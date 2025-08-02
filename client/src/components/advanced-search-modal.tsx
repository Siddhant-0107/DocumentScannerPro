import { useState } from "react";
import { Search, Calendar, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { type SearchParams, type Category } from "@shared/schema";

interface AdvancedSearchModalProps {
  searchParams: SearchParams;
  onSearchParamsChange: (params: SearchParams) => void;
  trigger: React.ReactNode;
}

export default function AdvancedSearchModal({ 
  searchParams, 
  onSearchParamsChange, 
  trigger 
}: AdvancedSearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localParams, setLocalParams] = useState<SearchParams>(searchParams);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleApplyFilters = () => {
    onSearchParamsChange(localParams);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedParams: SearchParams = {};
    setLocalParams(clearedParams);
    onSearchParamsChange(clearedParams);
    setIsOpen(false);
  };

  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    const currentCategories = localParams.categories || [];
    let updatedCategories: string[];
    
    if (checked) {
      updatedCategories = [...currentCategories, categoryName];
    } else {
      updatedCategories = currentCategories.filter(cat => cat !== categoryName);
    }
    
    setLocalParams({
      ...localParams,
      categories: updatedCategories.length > 0 ? updatedCategories : undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm shadow-lg rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter size={20} />
            Advanced Search
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Text</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                id="search-query"
                placeholder="Search in document content, titles, or tags..."
                value={localParams.query || ""}
                onChange={(e) => setLocalParams({ ...localParams, query: e.target.value || undefined })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="date-from"
                  type="date"
                  value={localParams.dateFrom || ""}
                  onChange={(e) => setLocalParams({ ...localParams, dateFrom: e.target.value || undefined })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="date-to"
                  type="date"
                  value={localParams.dateTo || ""}
                  onChange={(e) => setLocalParams({ ...localParams, dateTo: e.target.value || undefined })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Document Type Filter */}
          <div className="space-y-3">
            <Label>Document Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {['invoice', 'receipt', 'contract', 'resume', 'id', 'report', 'other'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`doctype-${type}`}
                    name="documentType"
                    value={type}
                    checked={localParams.documentType === type}
                    onChange={(e) => 
                      setLocalParams({ 
                        ...localParams, 
                        documentType: e.target.value || undefined 
                      })
                    }
                    className="w-4 h-4 text-primary"
                  />
                  <Label htmlFor={`doctype-${type}`} className="capitalize">
                    {type === 'id' ? 'ID Documents' : type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Entity Filters */}
          <div className="space-y-3">
            <Label>Must Contain</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEmails"
                  checked={localParams.hasEmails || false}
                  onCheckedChange={(checked) => 
                    setLocalParams({ 
                      ...localParams, 
                      hasEmails: checked ? true : undefined 
                    })
                  }
                />
                <Label htmlFor="hasEmails">Email Addresses</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPhones"
                  checked={localParams.hasPhones || false}
                  onCheckedChange={(checked) => 
                    setLocalParams({ 
                      ...localParams, 
                      hasPhones: checked ? true : undefined 
                    })
                  }
                />
                <Label htmlFor="hasPhones">Phone Numbers</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasAmounts"
                  checked={localParams.hasAmounts || false}
                  onCheckedChange={(checked) => 
                    setLocalParams({ 
                      ...localParams, 
                      hasAmounts: checked ? true : undefined 
                    })
                  }
                />
                <Label htmlFor="hasAmounts">Amounts/Prices</Label>
              </div>
            </div>
          </div>

          {/* Confidence Filter */}
          {localParams.minConfidence !== undefined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Minimum Confidence</Label>
                <span className="text-sm text-gray-500">
                  {Math.round((localParams.minConfidence || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localParams.minConfidence || 0}
                onChange={(e) => 
                  setLocalParams({ 
                    ...localParams, 
                    minConfidence: parseFloat(e.target.value) || undefined 
                  })
                }
                className="w-full"
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="invoice, receipt, important..."
              value={localParams.tags?.join(", ") || ""}
              onChange={(e) => {
                const tags = e.target.value.split(",").map(tag => tag.trim()).filter(Boolean);
                setLocalParams({ ...localParams, tags: tags.length > 0 ? tags : undefined });
              }}
            />
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label>Categories</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={(localParams.categories || []).includes(category.name)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category.name, checked as boolean)
                    }
                  />
                  <Label htmlFor={`category-${category.id}`} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                    <span className="text-xs text-gray-500">({category.documentCount})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-between pt-4 border-t bg-white sticky bottom-0">
          <Button variant="outline" onClick={handleClearFilters}>
            <X size={16} className="mr-2" />
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyFilters} className="bg-primary hover:bg-primary-600">
              <Search size={16} className="mr-2" />
              Search Documents
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}