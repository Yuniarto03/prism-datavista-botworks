
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PivotData {
  [key: string]: any;
}

interface PivotTableField {
  name: string;
  type: string;
  aggregation: string;
}

interface PivotTableProps {
  data: PivotData[];
  rowFields: PivotTableField[];
  columnFields: PivotTableField[];
  valueFields: PivotTableField[];
}

export const PivotTable: React.FC<PivotTableProps> = ({
  data,
  rowFields,
  columnFields,
  valueFields
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const toggleRowExpansion = (rowKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  // Generate pivot table structure
  const generatePivotData = () => {
    if (data.length === 0 || valueFields.length === 0) return null;

    // Group data by row fields
    const rowGroups: { [key: string]: any[] } = {};
    
    data.forEach(row => {
      const rowKey = rowFields.map(field => row[field.name] || '').join('|');
      if (!rowGroups[rowKey]) {
        rowGroups[rowKey] = [];
      }
      rowGroups[rowKey].push(row);
    });

    // Generate column headers
    const columnKeys = new Set<string>();
    if (columnFields.length > 0) {
      data.forEach(row => {
        const colKey = columnFields.map(field => row[field.name] || '').join('|');
        columnKeys.add(colKey);
      });
    } else {
      columnKeys.add('Total');
    }

    return { rowGroups, columnKeys: Array.from(columnKeys) };
  };

  const pivotData = generatePivotData();

  const calculateAggregation = (values: number[], aggregation: string) => {
    if (values.length === 0) return 0;
    
    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'count':
        return values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'average':
      case 'mean':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'median':
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      case 'sdev':
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  };

  if (!pivotData || Object.keys(pivotData.rowGroups).length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-neon-blue/50" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Pivot Data</h3>
        <p className="text-gray-500">Add fields to Rows and Values to generate pivot table</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto border border-neon-blue/30 rounded-lg bg-cyber-dark">
      <table className="w-full">
        <thead>
          <tr className="bg-cyber-gray/50">
            <th className="sticky left-0 bg-cyber-gray/50 px-4 py-3 text-left font-semibold text-neon-blue border-r border-neon-blue/20">
              {rowFields.map(field => field.name).join(' / ')}
            </th>
            {pivotData.columnKeys.map(colKey => (
              <th key={colKey} className="px-4 py-3 text-center font-semibold text-neon-purple border-r border-neon-blue/20">
                {colKey}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(pivotData.rowGroups).map(([rowKey, rowData], index) => {
            const isExpanded = expandedRows.has(rowKey);
            const hasSubRows = rowFields.length > 1;
            
            return (
              <tr key={rowKey} className="border-t border-neon-blue/20 hover:bg-neon-blue/5">
                <td className="sticky left-0 bg-cyber-dark px-4 py-3 border-r border-neon-blue/20">
                  <div className="flex items-center space-x-2">
                    {hasSubRows && (
                      <Button
                        size="sm"
                        onClick={() => toggleRowExpansion(rowKey)}
                        className="w-6 h-6 p-0 bg-transparent hover:bg-neon-blue/20"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-neon-blue" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neon-blue" />
                        )}
                      </Button>
                    )}
                    <span className="text-white">{rowKey.split('|').join(' / ')}</span>
                  </div>
                </td>
                
                {pivotData.columnKeys.map(colKey => (
                  <td key={colKey} className="px-4 py-3 text-center border-r border-neon-blue/20">
                    {valueFields.map((valueField, valueIndex) => {
                      const relevantData = columnFields.length > 0 
                        ? rowData.filter(row => {
                            const dataColKey = columnFields.map(field => row[field.name] || '').join('|');
                            return dataColKey === colKey;
                          })
                        : rowData;
                      
                      const values = relevantData
                        .map(row => Number(row[valueField.name]))
                        .filter(val => !isNaN(val));
                      
                      const result = calculateAggregation(values, valueField.aggregation);
                      
                      return (
                        <div key={valueIndex} className="text-gray-300">
                          {result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      );
                    })}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
