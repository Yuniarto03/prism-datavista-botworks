
import React, { useMemo, useState } from 'react';
import { BarChart3, Rows, Columns, Calculator, Download, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableField } from '@/components/pivot/DraggableField';
import { PivotDropZone } from '@/components/pivot/PivotDropZone';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface EnhancedPivotData {
  [key: string]: any;
  _children?: EnhancedPivotData[];
  _expanded?: boolean;
  _level?: number;
}

const AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'average', label: 'Average' },
  { value: 'mean', label: 'Mean' },
  { value: 'median', label: 'Median' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'sdev', label: 'Standard Deviation' }
];

export const DataSummary: React.FC<DataSummaryProps> = ({ data, sheets = [], currentSheet = '' }) => {
  const [rowFields, setRowFields] = useState<DroppedField[]>([]);
  const [columnFields, setColumnFields] = useState<DroppedField[]>([]);
  const [valueFields, setValueFields] = useState<DroppedField[]>([]);
  const [filters, setFilters] = useState<PivotFilter[]>([
    { column: '', value: '' },
    { column: '', value: '' },
    { column: '', value: '' }
  ]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

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

  // Get unique values for filter dropdowns
  const getUniqueValues = (column: string) => {
    if (!column || data.length === 0) return [];
    return [...new Set(data.map(row => String(row[column])).filter(val => val !== 'undefined' && val !== 'null' && val !== ''))];
  };

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return filters.every(filter => {
        if (!filter.column || !filter.value) return true;
        return String(row[filter.column]) === filter.value;
      });
    });
  }, [data, filters]);

  const calculateAggregation = (values: any[], aggregation: string) => {
    const numericValues = values.filter(val => !isNaN(Number(val))).map(Number);
    
    switch (aggregation) {
      case 'sum':
        return numericValues.reduce((a, b) => a + b, 0);
      case 'count':
        return values.length;
      case 'average':
      case 'mean':
        return numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
      case 'median':
        if (numericValues.length === 0) return 0;
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      case 'min':
        return numericValues.length > 0 ? Math.min(...numericValues) : 0;
      case 'max':
        return numericValues.length > 0 ? Math.max(...numericValues) : 0;
      case 'sdev':
        if (numericValues.length <= 1) return 0;
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
        return Math.sqrt(variance);
      default:
        return numericValues.reduce((a, b) => a + b, 0);
    }
  };

  // Generate enhanced pivot data with hierarchical structure
  const enhancedPivotData = useMemo(() => {
    if (rowFields.length === 0 || valueFields.length === 0) return [];

    const grouped = new Map();
    
    filteredData.forEach(row => {
      const rowKey = rowFields.map(field => row[field.name]).join('|||');
      
      if (!grouped.has(rowKey)) {
        grouped.set(rowKey, []);
      }
      grouped.get(rowKey).push(row);
    });

    const result: EnhancedPivotData[] = [];
    
    for (const [key, rows] of grouped) {
      const keyParts = key.split('|||');
      const item: EnhancedPivotData = {
        _level: 0,
        _expanded: expandedRows.has(key)
      };
      
      // Add row field values
      rowFields.forEach((field, index) => {
        item[field.name] = keyParts[index];
      });
      
      // Add aggregated values
      valueFields.forEach(field => {
        const values = rows.map(row => row[field.name]);
        item[`${field.name}_${field.aggregation}`] = calculateAggregation(values, field.aggregation || 'sum');
      });
      
      result.push(item);
    }

    return result;
  }, [filteredData, rowFields, valueFields, expandedRows]);

  const handleDropToRows = (field: DroppedField) => {
    if (!rowFields.find(f => f.name === field.name)) {
      setRowFields(prev => [...prev, { ...field, aggregation: 'count' }]);
    }
  };

  const handleDropToColumns = (field: DroppedField) => {
    if (!columnFields.find(f => f.name === field.name)) {
      setColumnFields(prev => [...prev, { ...field, aggregation: 'count' }]);
    }
  };

  const handleDropToValues = (field: DroppedField) => {
    if (!valueFields.find(f => f.name === field.name)) {
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

  const handleFilterChange = (index: number, field: 'column' | 'value', newValue: string) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, [field]: newValue } : filter
    ));
  };

  const handleReset = () => {
    setRowFields([]);
    setColumnFields([]);
    setValueFields([]);
    setFilters([
      { column: '', value: '' },
      { column: '', value: '' },
      { column: '', value: '' }
    ]);
    setExpandedRows(new Set());
    toast({
      title: "Reset Complete",
      description: "All configurations have been reset to default",
    });
  };

  const toggleRowExpansion = (rowKey: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  };

  const handleExportSummary = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      configuration: {
        rows: rowFields,
        columns: columnFields,
        values: valueFields,
        filters: filters
      },
      data: enhancedPivotData,
      dataInfo: {
        totalRows: filteredData.length,
        columns: availableFields.length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-summary-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Summary Exported!",
      description: "Data summary has been exported successfully",
    });
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
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neon-blue glow-text">Enhanced Data Summary</h2>
            <p className="text-gray-400">
              Configure fields to create dynamic pivot tables • {filteredData.length} records
              {currentSheet && (
                <span className="ml-2">• Sheet: <span className="text-neon-blue">{currentSheet}</span></span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleReset}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleExportSummary}
              disabled={enhancedPivotData.length === 0}
              className="neon-button"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Summary
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel - Field Library */}
          <div className="space-y-6">
            <div className="cyber-card p-4">
              <h3 className="text-lg font-semibold text-neon-green mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Field Library
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableFields.map((field) => (
                  <DraggableField
                    key={field.name}
                    name={field.name}
                    type={field.type}
                  />
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="cyber-card p-4">
              <h3 className="text-lg font-semibold text-neon-orange mb-4">Advanced Filters</h3>
              <div className="space-y-4">
                {filters.map((filter, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Column {index + 1}</label>
                      <Select value={filter.column} onValueChange={(value) => handleFilterChange(index, 'column', value)}>
                        <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                          <SelectItem value="">None</SelectItem>
                          {availableFields.map(field => (
                            <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Value {index + 1}</label>
                      <Select 
                        value={filter.value} 
                        onValueChange={(value) => handleFilterChange(index, 'value', value)}
                        disabled={!filter.column}
                      >
                        <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                          <SelectItem value="">None</SelectItem>
                          {filter.column && getUniqueValues(filter.column).map(value => (
                            <SelectItem key={value} value={value}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Configuration */}
          <div className="cyber-card p-4 space-y-6">
            <h3 className="text-lg font-semibold text-neon-purple mb-4">Pivot Configuration</h3>
            
            {/* Rows Configuration */}
            <PivotDropZone
              title="Rows"
              fields={rowFields}
              onDrop={handleDropToRows}
              onRemove={handleRemoveFromRows}
              icon={<Rows className="w-4 h-4" />}
              description="Drop fields here to create row groupings"
            />

            {/* Columns Configuration */}
            <PivotDropZone
              title="Columns"
              fields={columnFields}
              onDrop={handleDropToColumns}
              onRemove={handleRemoveFromColumns}
              icon={<Columns className="w-4 h-4" />}
              description="Drop fields here to create column groupings"
            />

            {/* Values Configuration */}
            <PivotDropZone
              title="Values"
              fields={valueFields}
              onDrop={handleDropToValues}
              onRemove={handleRemoveFromValues}
              onAggregationChange={handleValueAggregationChange}
              allowAggregation={true}
              icon={<Calculator className="w-4 h-4" />}
              description="Drop fields here to aggregate values"
            />
          </div>
        </div>

        {/* Full Width Summary Results */}
        <div className="cyber-card p-6">
          <h3 className="text-lg font-semibold text-neon-orange mb-4">Summary Results</h3>
          {rowFields.length > 0 && valueFields.length > 0 ? (
            <div className="overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="border-neon-blue/30">
                    {rowFields.map((field, index) => (
                      <TableHead key={field.name} className="text-neon-blue font-semibold">
                        {field.name} {index > 0 && <span className="text-xs">(Level {index + 1})</span>}
                      </TableHead>
                    ))}
                    {valueFields.map(field => (
                      <TableHead key={`${field.name}_${field.aggregation}`} className="text-neon-green font-semibold">
                        {field.name} ({field.aggregation})
                      </TableHead>
                    ))}
                    {rowFields.length > 1 && (
                      <TableHead className="text-neon-purple font-semibold w-16">Expand</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enhancedPivotData.map((row, index) => {
                    const rowKey = rowFields.map(field => row[field.name]).join('|||');
                    return (
                      <TableRow key={index} className="border-neon-blue/20 hover:bg-neon-blue/5">
                        {rowFields.map((field, fieldIndex) => (
                          <TableCell key={field.name} className="text-gray-300">
                            {fieldIndex === 0 ? (
                              <div className="flex items-center">
                                {rowFields.length > 1 && (
                                  <button
                                    onClick={() => toggleRowExpansion(rowKey)}
                                    className="mr-2 text-neon-blue hover:text-neon-purple transition-colors"
                                  >
                                    {expandedRows.has(rowKey) ? 
                                      <ChevronDown className="w-4 h-4" /> : 
                                      <ChevronRight className="w-4 h-4" />
                                    }
                                  </button>
                                )}
                                {row[field.name]}
                              </div>
                            ) : (
                              <div className={`pl-6 ${expandedRows.has(rowKey) ? 'block' : 'hidden'}`}>
                                {row[field.name]}
                              </div>
                            )}
                          </TableCell>
                        ))}
                        {valueFields.map(field => (
                          <TableCell key={`${field.name}_${field.aggregation}`} className="text-neon-green font-medium">
                            {typeof row[`${field.name}_${field.aggregation}`] === 'number' 
                              ? row[`${field.name}_${field.aggregation}`].toFixed(2)
                              : row[`${field.name}_${field.aggregation}`]
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-neon-blue/50" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Summary Results Ready</h3>
              <p className="text-gray-500">Drag fields to Rows and Values sections to generate summary results</p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};
