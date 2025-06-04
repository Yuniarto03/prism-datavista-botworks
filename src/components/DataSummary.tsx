
import React, { useMemo, useState } from 'react';
import { BarChart3, Rows, Columns, Calculator, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataSummaryProps {
  data: any[];
  sheets?: string[];
  currentSheet?: string;
}

interface DroppedField {
  name: string;
  type: 'numeric' | 'text';
  aggregation?: string;
}

interface PivotFilter {
  column: string;
  value: string;
}

export const DataSummary: React.FC<DataSummaryProps> = ({ data, sheets = [], currentSheet = '' }) => {
  const [rowFields, setRowFields] = useState<DroppedField[]>([]);
  const [columnFields, setColumnFields] = useState<DroppedField[]>([]);
  const [valueFields, setValueFields] = useState<DroppedField[]>([]);
  const [filters, setFilters] = useState<PivotFilter[]>([]);

  // Get available fields and their types
  const availableFields = useMemo(() => {
    if (data.length === 0) return [];

    const columns = Object.keys(data[0]);
    
    return columns.map((column): DroppedField => {
      const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
      const numericValues = values.filter(val => typeof val === 'number' || (!isNaN(Number(val)) && val !== ''));
      const isNumeric = numericValues.length > values.length * 0.7; // 70% threshold
      
      return {
        name: column,
        type: isNumeric ? 'numeric' : 'text'
      };
    });
  }, [data]);

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return filters.every(filter => String(row[filter.column]) === filter.value);
    });
  }, [data, filters]);

  const handleAddToRows = (fieldName: string) => {
    const field = availableFields.find(f => f.name === fieldName);
    if (field && !rowFields.find(f => f.name === field.name)) {
      setRowFields(prev => [...prev, field]);
    }
  };

  const handleAddToColumns = (fieldName: string) => {
    const field = availableFields.find(f => f.name === fieldName);
    if (field && !columnFields.find(f => f.name === field.name)) {
      setColumnFields(prev => [...prev, field]);
    }
  };

  const handleAddToValues = (fieldName: string) => {
    const field = availableFields.find(f => f.name === fieldName);
    if (field && !valueFields.find(f => f.name === field.name)) {
      const newField = { ...field, aggregation: field.type === 'numeric' ? 'sum' : 'count' };
      setValueFields(prev => [...prev, newField]);
    }
  };

  const handleRemoveFromRows = (index: number) => {
    setRowFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveFromColumns = (index: number) => {
    setColumnFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveFromValues = (index: number) => {
    setValueFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleValueAggregationChange = (index: number, aggregation: string) => {
    setValueFields(prev => prev.map((field, i) => 
      i === index ? { ...field, aggregation } : field
    ));
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Data to Analyze</h3>
        <p className="text-gray-500">Upload a dataset to create pivot tables and advanced analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neon-blue glow-text">Data Summary - Pivot Analysis</h2>
          <p className="text-gray-400">
            Configure fields to create dynamic pivot tables • {filteredData.length} records
            {currentSheet && (
              <span className="ml-2">• Sheet: <span className="text-neon-blue">{currentSheet}</span></span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-neon-purple animate-pulse" />
          <span className="text-neon-purple text-sm font-semibold">Advanced Pivot Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Panel - Field Library */}
        <div className="xl:col-span-1">
          <div className="cyber-card p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-neon-green mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Field Library
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableFields.map((field) => (
                <div key={field.name} className="flex items-center space-x-2 p-2 rounded border border-neon-purple/30 bg-cyber-light">
                  <div className={`w-3 h-3 rounded ${field.type === 'numeric' ? 'bg-neon-green' : 'bg-neon-orange'}`} />
                  <span className="text-white text-sm truncate flex-1">{field.name}</span>
                  <span className="text-xs text-gray-400">{field.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel - Configuration */}
        <div className="xl:col-span-1">
          <div className="cyber-card p-4 space-y-6 sticky top-4">
            <h3 className="text-lg font-semibold text-neon-purple mb-4">Pivot Configuration</h3>
            
            {/* Rows Configuration */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-neon-blue">
                <Rows className="w-4 h-4" />
                <span>Rows</span>
              </div>
              <Select onValueChange={handleAddToRows}>
                <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                  <SelectValue placeholder="Add field to rows" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                  {availableFields.filter(f => !rowFields.find(rf => rf.name === f.name)).map(field => (
                    <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-1">
                {rowFields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between bg-cyber-dark/60 p-2 rounded border border-neon-purple/30">
                    <span className="text-white text-sm">{field.name}</span>
                    <Button
                      size="sm"
                      onClick={() => handleRemoveFromRows(index)}
                      className="w-6 h-6 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Columns Configuration */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-neon-blue">
                <Columns className="w-4 h-4" />
                <span>Columns</span>
              </div>
              <Select onValueChange={handleAddToColumns}>
                <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                  <SelectValue placeholder="Add field to columns" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                  {availableFields.filter(f => !columnFields.find(cf => cf.name === f.name)).map(field => (
                    <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-1">
                {columnFields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between bg-cyber-dark/60 p-2 rounded border border-neon-purple/30">
                    <span className="text-white text-sm">{field.name}</span>
                    <Button
                      size="sm"
                      onClick={() => handleRemoveFromColumns(index)}
                      className="w-6 h-6 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Values Configuration */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-neon-blue">
                <Calculator className="w-4 h-4" />
                <span>Values</span>
              </div>
              <Select onValueChange={handleAddToValues}>
                <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                  <SelectValue placeholder="Add field to values" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                  {availableFields.filter(f => !valueFields.find(vf => vf.name === f.name)).map(field => (
                    <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-1">
                {valueFields.map((field, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-cyber-dark/60 p-2 rounded border border-neon-purple/30">
                    <span className="text-white text-sm flex-1">{field.name}</span>
                    <Select 
                      value={field.aggregation || 'sum'} 
                      onValueChange={(value) => handleValueAggregationChange(index, value)}
                    >
                      <SelectTrigger className="w-20 h-6 text-xs bg-neon-purple/20 border-neon-purple/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-cyber-dark border-neon-purple/30 text-white">
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="min">Min</SelectItem>
                        <SelectItem value="max">Max</SelectItem>
                        <SelectItem value="average">Avg</SelectItem>
                        <SelectItem value="sdev">StDev</SelectItem>
                        <SelectItem value="mean">Mean</SelectItem>
                        <SelectItem value="median">Median</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => handleRemoveFromValues(index)}
                      className="w-6 h-6 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Pivot Table Results */}
        <div className="xl:col-span-2">
          <div className="cyber-card p-4">
            <h3 className="text-lg font-semibold text-neon-orange mb-4">Pivot Table Results</h3>
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-neon-blue/50" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Pivot Table Ready</h3>
              <p className="text-gray-500">Add fields to Rows and Values to generate pivot table</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
