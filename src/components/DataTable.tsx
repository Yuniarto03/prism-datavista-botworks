import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUp, ArrowDown, Download, Type, Eye, Settings, RefreshCw, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface DataTableProps {
  data: any[];
  sheets?: string[];
  currentSheet?: string;
  onSheetChange?: (sheetName: string) => void;
  onRegenerate?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  sheets = [], 
  currentSheet = '', 
  onSheetChange,
  onRegenerate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dynamic filter states (5 filters now)
  const [header2, setHeader2] = useState<string>('');
  const [values2, setValues2] = useState<string[]>([]);
  const [header3, setHeader3] = useState<string>('');
  const [values3, setValues3] = useState<string[]>([]);
  const [header4, setHeader4] = useState<string>('');
  const [values4, setValues4] = useState<string[]>([]);
  const [header5, setHeader5] = useState<string>('');
  const [values5, setValues5] = useState<string[]>([]);
  
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState('14');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [showAllRows, setShowAllRows] = useState(false);
  const [showDynamicFilters, setShowDynamicFilters] = useState(false);
  
  const itemsPerPage = showAllRows ? data.length : 50;
  const [decimalPlaces, setDecimalPlaces] = useState(() => {
    const saved = localStorage.getItem('decimal-places');
    return saved ? parseInt(saved) : 0;
  });
  const { toast } = useToast();

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Check if any filters are active
  const isFiltering = useMemo(() => {
    return searchTerm || 
           (header2 && values2.length > 0) || 
           (header3 && values3.length > 0) || 
           (header4 && values4.length > 0) ||
           (header5 && values5.length > 0);
  }, [searchTerm, header2, values2, header3, values3, header4, values4, header5, values5]);

  // Enhanced search that works across all data
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    
    const results: Array<{row: any, rowIndex: number, matchedColumns: string[]}> = [];
    
    data.forEach((row, index) => {
      const matchedColumns: string[] = [];
      let hasMatch = false;
      
      Object.entries(row).forEach(([column, value]) => {
        if (String(value).toLowerCase().includes(searchTerm.toLowerCase())) {
          matchedColumns.push(column);
          hasMatch = true;
        }
      });
      
      if (hasMatch) {
        results.push({ row, rowIndex: index + 1, matchedColumns });
      }
    });
    
    return results;
  }, [data, searchTerm]);

  // Function to get filtered data up to a certain filter stage
  const getDataUpToFilter = (excludeFilter: number) => {
    let filtered = searchTerm ? searchResults.map(result => result.row) : data;

    // Apply filters in sequence, excluding the specified filter
    if (excludeFilter !== 2 && header2 && values2.length > 0) {
      filtered = filtered.filter(row => values2.includes(String(row[header2])));
    }
    
    if (excludeFilter !== 3 && header3 && values3.length > 0) {
      filtered = filtered.filter(row => values3.includes(String(row[header3])));
    }
    
    if (excludeFilter !== 4 && header4 && values4.length > 0) {
      filtered = filtered.filter(row => values4.includes(String(row[header4])));
    }

    if (excludeFilter !== 5 && header5 && values5.length > 0) {
      filtered = filtered.filter(row => values5.includes(String(row[header5])));
    }

    return filtered;
  };

  // Function to get available values for a column with proper counting
  const getFilteredUniqueValues = (column: string, filterStage: number) => {
    if (!column || data.length === 0) return [];
    
    const filteredData = getDataUpToFilter(filterStage);
    const values = [...new Set(filteredData.map(row => row[column]))];
    return values.filter(value => value !== undefined && value !== null && value !== '').map(String);
  };

  // Get counts for each value considering all previous filters
  const getValueCount = (column: string, value: string, filterStage: number) => {
    const filteredData = getDataUpToFilter(filterStage);
    return filteredData.filter(row => String(row[column]) === value).length;
  };

  // Get available values for each filter
  const availableValues2 = useMemo(() => getFilteredUniqueValues(header2, 2), [data, searchTerm, header2, searchResults]);
  const availableValues3 = useMemo(() => getFilteredUniqueValues(header3, 3), [data, searchTerm, header2, values2, header3, searchResults]);
  const availableValues4 = useMemo(() => getFilteredUniqueValues(header4, 4), [data, searchTerm, header2, values2, header3, values3, header4, searchResults]);
  const availableValues5 = useMemo(() => getFilteredUniqueValues(header5, 5), [data, searchTerm, header2, values2, header3, values3, header4, values4, header5, searchResults]);

  const filteredData = useMemo(() => {
    let filtered = searchTerm ? searchResults.map(result => result.row) : data;

    // Apply dynamic filters
    if (header2 && values2.length > 0) {
      filtered = filtered.filter(row => values2.includes(String(row[header2])));
    }
    
    if (header3 && values3.length > 0) {
      filtered = filtered.filter(row => values3.includes(String(row[header3])));
    }
    
    if (header4 && values4.length > 0) {
      filtered = filtered.filter(row => values4.includes(String(row[header4])));
    }

    if (header5 && values5.length > 0) {
      filtered = filtered.filter(row => values5.includes(String(row[header5])));
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, searchResults, header2, values2, header3, values3, header4, values4, header5, values5, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(filteredData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Exported Data');
      XLSX.writeFile(wb, `exported_data_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export Successful!",
        description: `Exported ${filteredData.length} records to Excel`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data to Excel",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
      toast({
        title: "Regenerating Data",
        description: "Processing current sheet with AI analysis...",
      });
    }
  };

  // Working font families with fallbacks
  const workingFonts = [
    { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
    { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
    { value: '"Courier New", Courier, monospace', label: 'Courier New' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
    { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
    { value: 'ui-monospace, "Courier New", monospace', label: 'Monospace' },
    { value: 'ui-serif, Georgia, serif', label: 'Serif' }
  ];

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Data Available</h3>
        <p className="text-gray-500">Upload a dataset to view the data table</p>
      </div>
    );
  }

  // Format numbers based on decimal places
  const formatNumber = (value: any) => {
    if (typeof value === 'number') {
      return value.toFixed(decimalPlaces);
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neon-blue glow-text">Data Table</h2>
          <div className="flex items-center space-x-4 text-gray-400">
            <span>
              {filteredData.length} of {data.length} records
              {searchTerm && searchResults.length > 0 && (
                <span className="text-neon-green ml-2">
                  • Found {searchResults.length} search results
                </span>
              )}
            </span>
            {currentSheet && (
              <span>Current Sheet: <span className="text-neon-blue">{currentSheet}</span></span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Reload Data Button */}
          {sheets.length > 0 && (
            <Button 
              onClick={() => {
                if (onSheetChange && currentSheet) {
                  onSheetChange(currentSheet);
                }
              }}
              className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Data
            </Button>
          )}
          {sheets.length > 0 && onRegenerate && (
            <Button 
              onClick={handleRegenerate}
              className="bg-neon-orange/20 hover:bg-neon-orange/30 text-neon-orange border border-neon-orange/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate AI
            </Button>
          )}
          <Button onClick={exportToExcel} className="bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/30">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Sheet Selector Dropdown */}
      {sheets.length > 1 && (
        <div className="cyber-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white mb-3">Sheet Selection</h3>
            <div className="flex items-center space-x-2">
              <label className="text-gray-400 text-sm">Available Sheets:</label>
              <Select value={currentSheet} onValueChange={onSheetChange}>
                <SelectTrigger className="w-48 bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                  <SelectValue placeholder="Select sheet" />
                  <ChevronDown className="w-4 h-4 ml-2" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                  {sheets.map(sheet => (
                    <SelectItem key={sheet} value={sheet} className="hover:bg-neon-blue/10">
                      {sheet} {sheet === currentSheet && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search with Results Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search with Results Counter */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neon-blue" />
          <Input
            type="text"
            placeholder="Search all columns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="pl-10 bg-cyber-light border-neon-blue/30 text-white placeholder-gray-400 focus:border-neon-blue"
          />
          {searchTerm && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-neon-green">
              {searchResults.length} found
            </div>
          )}
        </div>

        {/* Enhanced Font Settings */}
        <div className="flex space-x-2">
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
              <Type className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
              {workingFonts.map(font => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
              <SelectItem value="10">10px</SelectItem>
              <SelectItem value="12">12px</SelectItem>
              <SelectItem value="14">14px</SelectItem>
              <SelectItem value="16">16px</SelectItem>
              <SelectItem value="18">18px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
              <SelectItem value="22">22px</SelectItem>
              <SelectItem value="24">24px</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View All Toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="viewAll" 
            checked={showAllRows}
            onCheckedChange={(checked) => setShowAllRows(checked === true)}
            className="border-neon-green data-[state=checked]:bg-neon-green"
          />
          <Label htmlFor="viewAll" className="text-white cursor-pointer">
            <Eye className="w-4 h-4 inline mr-1" />
            View All
          </Label>
        </div>

        {/* Dynamic Filter Toggle with Indicator */}
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowDynamicFilters(!showDynamicFilters)}
            variant="outline"
            className={`bg-transparent border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10 ${isFiltering ? 'ring-2 ring-neon-orange animate-pulse' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Dynamic Filters
            {isFiltering && (
              <span className="ml-2 w-2 h-2 bg-neon-orange rounded-full animate-pulse"></span>
            )}
          </Button>
        </div>
      </div>

      {/* Search Results Summary */}
      {searchTerm && searchResults.length > 0 && (
        <div className="cyber-card p-4">
          <h3 className="text-lg font-semibold text-neon-green mb-2">Search Results</h3>
          <p className="text-gray-400 mb-3">
            Found <span className="text-neon-green font-bold">{searchResults.length}</span> results for "{searchTerm}"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {searchResults.slice(0, 12).map((result, index) => (
              <div key={index} className="text-sm bg-cyber-light p-2 rounded border border-neon-green/20">
                <span className="text-neon-blue">Row {result.rowIndex}</span>
                <span className="text-gray-400 ml-2">
                  in {result.matchedColumns.join(', ')}
                </span>
              </div>
            ))}
            {searchResults.length > 12 && (
              <div className="text-sm text-gray-500 p-2">
                +{searchResults.length - 12} more results...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Filters */}
      {showDynamicFilters && (
        <div className="cyber-card p-6">
          <h3 className="text-lg font-semibold text-neon-orange mb-4">Dynamic Filters</h3>
          
          {/* Filter 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-neon-blue mb-2 block">Header 2</Label>
              <Select value={header2 || "please-select"} onValueChange={(value) => {
                setHeader2(value === "please-select" ? "" : value);
                setValues2([]);
              }}>
                <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                  <SelectItem value="please-select">Please select</SelectItem>
                  {columns.map(column => (
                    <SelectItem key={column} value={column}>{column}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {header2 && availableValues2.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-neon-blue">Values 2 ({values2.length} selected, {availableValues2.length} available)</Label>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setValues2(availableValues2)} 
                      size="sm" 
                      className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue"
                    >
                      Select All
                    </Button>
                    <Button 
                      onClick={() => setValues2([])} 
                      size="sm" 
                      className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue"
                    >
                      Unselect All
                    </Button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto border border-neon-blue/30 rounded p-2">
                  {availableValues2.map(value => {
                    const count = getValueCount(header2, value, 2);
                    return (
                      <div key={value} className="flex items-center justify-between space-x-2 py-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`value2-${value}`}
                            checked={values2.includes(value)}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                setValues2([...values2, value]);
                              } else {
                                setValues2(values2.filter(v => v !== value));
                              }
                            }}
                            className="border-neon-blue data-[state=checked]:bg-neon-blue"
                          />
                          <Label htmlFor={`value2-${value}`} className="text-sm text-white cursor-pointer">
                            {value}
                          </Label>
                        </div>
                        <span className="text-xs text-gray-400">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Filter 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-neon-purple mb-2 block">Header 3</Label>
              <Select value={header3 || "please-select"} onValueChange={(value) => {
                setHeader3(value === "please-select" ? "" : value);
                setValues3([]);
              }}>
                <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                  <SelectItem value="please-select">Please select</SelectItem>
                  {columns.map(column => (
                    <SelectItem key={column} value={column}>{column}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {header3 && availableValues3.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-neon-purple">Values 3 ({values3.length} selected, {availableValues3.length} available)</Label>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setValues3(availableValues3)} 
                      size="sm" 
                      className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple"
                    >
                      Select All
                    </Button>
                    <Button 
                      onClick={() => setValues3([])} 
                      size="sm" 
                      className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple"
                    >
                      Unselect All
                    </Button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto border border-neon-purple/30 rounded p-2">
                  {availableValues3.map(value => {
                    const count = getValueCount(header3, value, 3);
                    return (
                      <div key={value} className="flex items-center justify-between space-x-2 py-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`value3-${value}`}
                            checked={values3.includes(value)}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                setValues3([...values3, value]);
                              } else {
                                setValues3(values3.filter(v => v !== value));
                              }
                            }}
                            className="border-neon-purple data-[state=checked]:bg-neon-purple"
                          />
                          <Label htmlFor={`value3-${value}`} className="text-sm text-white cursor-pointer">
                            {value}
                          </Label>
                        </div>
                        <span className="text-xs text-gray-400">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Filter 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-neon-green mb-2 block">Header 4</Label>
              <Select value={header4 || "please-select"} onValueChange={(value) => {
                setHeader4(value === "please-select" ? "" : value);
                setValues4([]);
              }}>
                <SelectTrigger className="bg-cyber-light border-neon-green/30 text-white focus:border-neon-green">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-light border-neon-green/30 text-white z-50">
                  <SelectItem value="please-select">Please select</SelectItem>
                  {columns.map(column => (
                    <SelectItem key={column} value={column}>{column}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {header4 && availableValues4.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-neon-green">Values 4 ({values4.length} selected, {availableValues4.length} available)</Label>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setValues4(availableValues4)} 
                      size="sm" 
                      className="bg-neon-green/20 hover:bg-neon-green/30 text-neon-green"
                    >
                      Select All
                    </Button>
                    <Button 
                      onClick={() => setValues4([])} 
                      size="sm" 
                      className="bg-neon-green/20 hover:bg-neon-green/30 text-neon-green"
                    >
                      Unselect All
                    </Button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto border border-neon-green/30 rounded p-2">
                  {availableValues4.map(value => {
                    const count = getValueCount(header4, value, 4);
                    return (
                      <div key={value} className="flex items-center justify-between space-x-2 py-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`value4-${value}`}
                            checked={values4.includes(value)}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                setValues4([...values4, value]);
                              } else {
                                setValues4(values4.filter(v => v !== value));
                              }
                            }}
                            className="border-neon-green data-[state=checked]:bg-neon-green"
                          />
                          <Label htmlFor={`value4-${value}`} className="text-sm text-white cursor-pointer">
                            {value}
                          </Label>
                        </div>
                        <span className="text-xs text-gray-400">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Filter 5 - New */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-neon-orange mb-2 block">Header 5</Label>
              <Select value={header5 || "please-select"} onValueChange={(value) => {
                setHeader5(value === "please-select" ? "" : value);
                setValues5([]);
              }}>
                <SelectTrigger className="bg-cyber-light border-neon-orange/30 text-white focus:border-neon-orange">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-light border-neon-orange/30 text-white z-50">
                  <SelectItem value="please-select">Please select</SelectItem>
                  {columns.map(column => (
                    <SelectItem key={column} value={column}>{column}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {header5 && availableValues5.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-neon-orange">Values 5 ({values5.length} selected, {availableValues5.length} available)</Label>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setValues5(availableValues5)} 
                      size="sm" 
                      className="bg-neon-orange/20 hover:bg-neon-orange/30 text-neon-orange"
                    >
                      Select All
                    </Button>
                    <Button 
                      onClick={() => setValues5([])} 
                      size="sm" 
                      className="bg-neon-orange/20 hover:bg-neon-orange/30 text-neon-orange"
                    >
                      Unselect All
                    </Button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto border border-neon-orange/30 rounded p-2">
                  {availableValues5.map(value => {
                    const count = getValueCount(header5, value, 5);
                    return (
                      <div key={value} className="flex items-center justify-between space-x-2 py-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`value5-${value}`}
                            checked={values5.includes(value)}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                setValues5([...values5, value]);
                              } else {
                                setValues5(values5.filter(v => v !== value));
                              }
                            }}
                            className="border-neon-orange data-[state=checked]:bg-neon-orange"
                          />
                          <Label htmlFor={`value5-${value}`} className="text-sm text-white cursor-pointer">
                            {value}
                          </Label>
                        </div>
                        <span className="text-xs text-gray-400">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-96 data-grid">
          <table className="w-full" style={{ fontFamily, fontSize: `${fontSize}px` }}>
            <thead className="bg-cyber-gray/50 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="px-4 py-3 text-left font-semibold text-neon-blue cursor-pointer hover:bg-neon-blue/10 transition-colors whitespace-nowrap"
                    style={{ fontFamily, fontSize: `${fontSize}px` }}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column}</span>
                      {sortColumn === column && (
                        sortDirection === 'asc' ? 
                        <ArrowUp className="w-4 h-4 text-neon-green" /> : 
                        <ArrowDown className="w-4 h-4 text-neon-orange" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr 
                  key={index}
                  className="border-t border-neon-blue/20 hover:bg-neon-blue/5 transition-colors"
                >
                  {columns.map((column) => {
                    const cellValue = formatNumber(row[column] || '');
                    const cellString = String(cellValue);
                    const isHighlighted = searchTerm && cellString.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    return (
                      <td 
                        key={column} 
                        className={`px-4 py-3 whitespace-nowrap ${isHighlighted ? 'bg-neon-green/20 text-neon-green' : 'text-gray-300'}`}
                        style={{ fontFamily, fontSize: `${fontSize}px` }}
                      >
                        {isHighlighted ? (
                          <span dangerouslySetInnerHTML={{
                            __html: cellString.replace(
                              new RegExp(searchTerm, 'gi'),
                              `<mark class="bg-neon-green/40 text-neon-green">${searchTerm}</mark>`
                            )
                          }} />
                        ) : (
                          cellString
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!showAllRows && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400">
            Page {currentPage} of {totalPages} • Showing {paginatedData.length} of {filteredData.length} results
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-cyber-light border border-neon-blue/30 text-white rounded-lg hover:border-neon-blue disabled:opacity-50 transition-colors"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-cyber-light border border-neon-blue/30 text-white rounded-lg hover:border-neon-blue disabled:opacity-50 transition-colors"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
