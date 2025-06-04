import React, { useState, useCallback } from 'react';
import { Database, Upload, FileText, Zap, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileUpload: (data: any[], sheets?: string[], currentSheet?: string, workbook?: XLSX.WorkBook) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          
          // Try to parse as number if it looks like one
          if (value && !isNaN(Number(value)) && value !== '') {
            const numValue = Number(value);
            if (Number.isFinite(numValue)) {
              row[header] = numValue;
            } else {
              row[header] = value;
            }
          } else {
            row[header] = value;
          }
        });
        data.push(row);
      }
    }
    return data;
  };

  const parseJSON = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        return [parsed];
      }
      return [];
    } catch (error) {
      console.error('JSON parsing error:', error);
      return [];
    }
  };

  const parseExcel = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get all sheet names
      const sheetNames = workbook.SheetNames;
      
      // Get the first worksheet
      const worksheetName = sheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) return { data: [], sheets: sheetNames, currentSheet: worksheetName, workbook };
      
      // First row as headers
      const headers = jsonData[0] as string[];
      const data = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i] as any[];
        if (rowData && rowData.length > 0) {
          const row: any = {};
          headers.forEach((header, index) => {
            let value = rowData[index];
            
            // Handle different data types from Excel
            if (value !== undefined && value !== null && value !== '') {
              // Try to parse as number if it looks like one
              if (typeof value === 'number') {
                row[header] = value;
              } else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
                const numValue = Number(value);
                if (Number.isFinite(numValue)) {
                  row[header] = numValue;
                } else {
                  row[header] = value;
                }
              } else {
                row[header] = value;
              }
            } else {
              row[header] = '';
            }
          });
          data.push(row);
        }
      }
      return { data, sheets: sheetNames, currentSheet: worksheetName, workbook };
    } catch (error) {
      console.error('Excel parsing error:', error);
      return { data: [], sheets: [], currentSheet: '', workbook: null };
    }
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 150);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    simulateUploadProgress();
    
    try {
      let data: any[] = [];
      let sheets: string[] = [];
      let currentSheet: string = '';
      let workbook: XLSX.WorkBook | null = null;
      const fileName = file.name.toLowerCase();
      
      setTimeout(async () => {
        if (fileName.endsWith('.csv')) {
          const text = await file.text();
          data = parseCSV(text);
        } else if (fileName.endsWith('.json')) {
          const text = await file.text();
          data = parseJSON(text);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          const result = await parseExcel(file);
          data = result.data;
          sheets = result.sheets;
          currentSheet = result.currentSheet;
          workbook = result.workbook;
        } else {
          // Try to parse as CSV by default for other text files
          const text = await file.text();
          data = parseCSV(text);
        }
        
        if (data.length === 0) {
          toast({
            title: "No Data Found",
            description: "The uploaded file appears to be empty or in an unsupported format.",
            variant: "destructive",
          });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }
        
        onFileUpload(data, sheets, currentSheet, workbook);
        setIsUploading(false);
        setUploadProgress(0);
        
        toast({
          title: "Upload Successful!",
          description: `Processed ${data.length} records from ${file.name}${sheets.length > 1 ? ` (${sheets.length} sheets available)` : ''}`,
        });
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        title: "Upload Failed",
        description: "Please check your file format and try again.",
        variant: "destructive",
      });
    }
  }, [onFileUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-3 p-4 cyber-border rounded-xl">
          <Database className="w-8 h-8 text-neon-blue animate-pulse" />
          <div>
            <h2 className="text-2xl font-bold text-neon-blue glow-text">
              Data Upload Center
            </h2>
            <p className="text-gray-400">
              Upload your real datasets for analysis and visualization
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        className={`
          relative cyber-card p-12 text-center transition-all duration-300 cursor-pointer
          ${isDragging ? 'border-neon-green bg-neon-green/5 scale-105' : 'hover:border-neon-blue/50 hover:bg-neon-blue/5'}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        {!isUploading ? (
          <>
            <div className="space-y-6">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center animate-float">
                <Upload className="w-12 h-12 text-white" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white">
                  {isDragging ? 'Drop your file here' : 'Upload Real Dataset'}
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Drag and drop your CSV, JSON, or Excel files here, or click to browse.
                  Upload your actual data for real-time processing and analysis.
                </p>
              </div>

              <input
                type="file"
                accept=".csv,.json,.txt,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              
              <label htmlFor="file-upload" className="neon-button inline-block cursor-pointer">
                Select File
              </label>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: FileText, label: 'CSV Files', desc: 'Comma-separated values with headers' },
                { icon: Database, label: 'JSON Data', desc: 'JavaScript Object Notation arrays' },
                { icon: FileSpreadsheet, label: 'Excel Files', desc: 'Excel spreadsheets (.xlsx, .xls)' }
              ].map((item, index) => (
                <div key={index} className="p-4 bg-cyber-light/30 rounded-lg border border-neon-blue/20">
                  <item.icon className={`w-6 h-6 mx-auto mb-2 ${['text-neon-blue', 'text-neon-green', 'text-neon-purple'][index]}`} />
                  <h4 className="font-medium text-white">{item.label}</h4>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-neon-green to-neon-blue rounded-full flex items-center justify-center animate-spin">
              <Database className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-neon-green glow-text">
                Processing Your Data...
              </h3>
              
              <div className="max-w-md mx-auto">
                <div className="bg-cyber-gray rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-blue to-neon-green transition-all duration-300 animate-glow-pulse"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {Math.round(uploadProgress)}% Complete
                </p>
              </div>
              
              <div className="text-sm text-gray-400 space-y-1">
                <p>• Reading file structure...</p>
                <p>• Parsing data records...</p>
                <p>• Preparing for analysis...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Database, title: 'Real Data', desc: 'Process your actual datasets', color: 'neon-blue' },
          { icon: Zap, title: 'Real-time', desc: 'Instant data processing', color: 'neon-green' },
          { icon: FileSpreadsheet, title: 'Multi-format', desc: 'CSV, JSON & Excel support', color: 'neon-purple' },
          { icon: Upload, title: 'Secure Upload', desc: 'Safe data handling', color: 'neon-orange' }
        ].map((feature, index) => (
          <div key={index} className="cyber-card p-4 text-center group hover:scale-105 transition-transform duration-300">
            <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-${feature.color} to-neon-purple rounded-lg flex items-center justify-center group-hover:animate-glow-pulse`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
            <p className="text-xs text-gray-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
