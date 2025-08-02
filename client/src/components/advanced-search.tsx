import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export interface SearchFilters {
  query?: string;
  documentType?: string;
  hasEmails?: boolean;
  hasPhones?: boolean;
  hasAmounts?: boolean;
  minConfidence?: number;
}

const documentTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'receipt', label: 'Receipts' },
  { value: 'contract', label: 'Contracts' },
  { value: 'resume', label: 'Resumes' },
  { value: 'id', label: 'ID Documents' },
  { value: 'report', label: 'Reports' },
  { value: 'other', label: 'Other' }
];

export default function AdvancedSearch({ onSearch, isLoading }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    documentType: 'all',
    hasEmails: false,
    hasPhones: false,
    hasAmounts: false,
    minConfidence: 0
  });
  
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearch = () => {
    const searchFilters = { ...filters };
    
    // Clean up filters
    if (!searchFilters.query?.trim()) {
      delete searchFilters.query;
    }
    if (searchFilters.documentType === 'all') {
      delete searchFilters.documentType;
    }
    if (!searchFilters.hasEmails) {
      delete searchFilters.hasEmails;
    }
    if (!searchFilters.hasPhones) {
      delete searchFilters.hasPhones;
    }
    if (!searchFilters.hasAmounts) {
      delete searchFilters.hasAmounts;
    }
    if (searchFilters.minConfidence === 0) {
      delete searchFilters.minConfidence;
    }

    onSearch(searchFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      query: '',
      documentType: 'all',
      hasEmails: false,
      hasPhones: false,
      hasAmounts: false,
      minConfidence: 0
    };
    setFilters(resetFilters);
    onSearch({});
  };

  const hasActiveFilters = () => {
    return (
      filters.query?.trim() ||
      (filters.documentType && filters.documentType !== 'all') ||
      filters.hasEmails ||
      filters.hasPhones ||
      filters.hasAmounts ||
      (filters.minConfidence && filters.minConfidence > 0)
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query?.trim()) count++;
    if (filters.documentType && filters.documentType !== 'all') count++;
    if (filters.hasEmails) count++;
    if (filters.hasPhones) count++;
    if (filters.hasAmounts) count++;
    if (filters.minConfidence && filters.minConfidence > 0) count++;
    return count;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search
          </div>
          {hasActiveFilters() && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search documents, content, entities..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Advanced Filters Toggle */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-center">
              <Filter className="w-4 h-4 mr-2" />
              {isAdvancedOpen ? 'Hide' : 'Show'} Advanced Filters
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Document Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Document Type</Label>
              <Select
                value={filters.documentType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Must Contain</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasEmails"
                    checked={filters.hasEmails}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, hasEmails: checked as boolean }))
                    }
                  />
                  <Label htmlFor="hasEmails" className="text-sm">Email Addresses</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPhones"
                    checked={filters.hasPhones}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, hasPhones: checked as boolean }))
                    }
                  />
                  <Label htmlFor="hasPhones" className="text-sm">Phone Numbers</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasAmounts"
                    checked={filters.hasAmounts}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, hasAmounts: checked as boolean }))
                    }
                  />
                  <Label htmlFor="hasAmounts" className="text-sm">Amounts/Prices</Label>
                </div>
              </div>
            </div>

            {/* Confidence Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Minimum Confidence</Label>
                <span className="text-sm text-gray-500">
                  {Math.round((filters.minConfidence || 0) * 100)}%
                </span>
              </div>
              <Slider
                value={[filters.minConfidence || 0]}
                onValueChange={([value]) => setFilters(prev => ({ ...prev, minConfidence: value }))}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
                Apply Filters
              </Button>
              {hasActiveFilters() && (
                <Button variant="outline" onClick={handleReset}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
