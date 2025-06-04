
import React, { useMemo, useState } from 'react';
import { BarChart3, Rows, Columns, Calculator, Sparkles, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableField } from '@/components/pivot/DraggableField';
import { PivotDropZone } from '@/components/pivot/PivotDropZone';
import { PivotTable } from '@/components/pivot/PivotTable';
import { useToast } from '@/hooks/use-toast';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string>('');
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

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return filters.every(filter => String(row[filter.column]) === filter.value);
    });
  }, [data, filters]);

  const handleDropToRows = (field: DroppedField) => {
    if (!rowFields.find(f => f.name === field.name)) {
      setRowFields(prev => [...prev, field]);
    }
  };

  const handleDropToColumns = (field: DroppedField) => {
    if (!columnFields.find(f => f.name === field.name)) {
      setColumnFields(prev => [...prev, field]);
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

  const handleGenerateSummary = async () => {
    if (data.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please upload data first to generate summary",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Create a comprehensive data summary
      const dataSummary = {
        totalRows: filteredData.length,
        columns: availableFields,
        pivotConfiguration: {
          rows: rowFields,
          columns: columnFields,
          values: valueFields
        },
        sampleData: filteredData.slice(0, 10)
      };

      // Generate AI summary using Google AI (simplified simulation for now)
      const summary = `
📊 **Data Summary Report**

**Dataset Overview:**
- Total Records: ${dataSummary.totalRows}
- Columns: ${dataSummary.columns.length}
- Current Sheet: ${currentSheet || 'Default'}

**Field Configuration:**
- Row Fields: ${rowFields.map(f => f.name).join(', ') || 'None'}
- Column Fields: ${columnFields.map(f => f.name).join(', ') || 'None'}  
- Value Fields: ${valueFields.map(f => `${f.name} (${f.aggregation})`).join(', ') || 'None'}

**Key Insights:**
- Numeric Fields: ${availableFields.filter(f => f.type === 'numeric').length}
- Categorical Fields: ${availableFields.filter(f => f.type === 'text').length}

This summary provides a comprehensive overview of your data structure and current pivot configuration.
      `;

      setGeneratedSummary(summary);
      
      toast({
        title: "Summary Generated!",
        description: "Data summary has been generated successfully",
      });

    } catch (error) {
      console.error('Summary generation error:', error);
      toast({
        title: "Summary Generation Failed",
        description: "Failed to generate data summary",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportSummary = () => {
    if (!generatedSummary) {
      toast({
        title: "No Summary to Export",
        description: "Please generate a summary first",
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      summary: generatedSummary,
      configuration: {
        rows: rowFields,
        columns: columnFields,
        values: valueFields
      },
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
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Summary'}
            </Button>
            <Button
              onClick={handleExportSummary}
              disabled={!generatedSummary}
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

            {/* Generated Summary Display */}
            {generatedSummary && (
              <div className="cyber-card p-4">
                <h3 className="text-lg font-semibold text-neon-orange mb-4">Generated Summary</h3>
                <div className="bg-cyber-dark/60 p-4 rounded border border-neon-blue/30 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">{generatedSummary}</pre>
                </div>
              </div>
            )}
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
            <PivotTable
              data={filteredData}
              rowFields={rowFields}
              columnFields={columnFields}
              valueFields={valueFields}
            />
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
