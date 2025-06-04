import React from 'react';
import { Filter, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface PivotFilter {
  column: string;
  value: string;
}

interface PivotFiltersProps {
  data: any[];
  filters: PivotFilter[];
  onAddFilter: (filter: PivotFilter) => void;
  onRemoveFilter: (index: number) => void;
  availableColumns: string[];
}

export const PivotFilters: React.FC<PivotFiltersProps> = ({
  data,
  filters,
  onAddFilter,
  onRemoveFilter,
  availableColumns
}) => {
  const [newFilter, setNewFilter] = React.useState<PivotFilter>({ column: '', value: '' });
  
  const getUniqueValues = (column: string) => {
    if (!column || data.length === 0) return [];
    const values = [...new Set(data.map(row => row[column]))].filter(val => val !== null && val !== undefined);
    return values.map(val => String(val)).sort();
  };

  const handleAddFilter = () => {
    if (newFilter.column && newFilter.value) {
      onAddFilter(newFilter);
      setNewFilter({ column: '', value: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-neon-blue">
        <Filter className="w-5 h-5" />
        <h3 className="font-semibold">Filters</h3>
      </div>
      
      {/* Existing Filters */}
      <div className="space-y-2">
        {filters.map((filter, index) => (
          <div key={index} className="flex items-center space-x-2 bg-cyber-light p-2 rounded border border-neon-purple/30">
            <span className="text-sm text-white flex-1">
              {filter.column}: {filter.value}
            </span>
            <Button
              size="sm"
              onClick={() => onRemoveFilter(index)}
              className="w-6 h-6 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New Filter */}
      <div className="grid grid-cols-3 gap-2">
        <Select value={newFilter.column} onValueChange={(value) => setNewFilter(prev => ({ ...prev, column: value, value: '' }))}>
          <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
            {availableColumns.map(column => (
              <SelectItem key={column} value={column}>{column}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={newFilter.value} 
          onValueChange={(value) => setNewFilter(prev => ({ ...prev, value }))}
          disabled={!newFilter.column}
        >
          <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
            {getUniqueValues(newFilter.column).map(value => (
              <SelectItem key={value} value={value}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleAddFilter}
          disabled={!newFilter.column || !newFilter.value}
          className="bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/30"
        >
          Add
        </Button>
      </div>
    </div>
  );
};
