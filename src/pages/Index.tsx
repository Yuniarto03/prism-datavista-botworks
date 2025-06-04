import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DataTable } from "@/components/DataTable";
import { DataSummary } from "@/components/DataSummary";
import { AIInsight } from "@/components/AIInsight";
import { DataVisualization } from "@/components/DataVisualization";
import { FileUpload } from "@/components/FileUpload";
import { AIDocumentProcessor } from "@/components/AIDocumentProcessor";
import { ChatBot } from "@/components/ChatBot";
import * as XLSX from 'xlsx';
import { AppSettings } from "@/components/AppSettings";

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [currentSheet, setCurrentSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [decimalPlaces, setDecimalPlaces] = useState(() => {
    const saved = localStorage.getItem('decimal-places');
    return saved ? parseInt(saved) : 0;
  });

  const handleFileUpload = (data: any[], sheets?: string[], currentSheetName?: string, wb?: XLSX.WorkBook) => {
    setUploadedData(data);
    setAvailableSheets(sheets || []);
    setCurrentSheet(currentSheetName || '');
    setWorkbook(wb || null);
    setActiveTab("table");
  };

  const handleSheetChange = (sheetName: string) => {
    if (!workbook) return;
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) return;
    
    const headers = jsonData[0] as string[];
    const data = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i] as any[];
      if (rowData && rowData.length > 0) {
        const row: any = {};
        headers.forEach((header, index) => {
          let value = rowData[index];
          
          if (value !== undefined && value !== null && value !== '') {
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
    
    setUploadedData(data);
    setCurrentSheet(sheetName);
  };

  const handleRegenerate = () => {
    if (currentSheet && workbook) {
      // Re-process current sheet (could trigger AI analysis)
      handleSheetChange(currentSheet);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "upload":
        return <FileUpload onFileUpload={handleFileUpload} />;
      case "table":
        return (
          <DataTable 
            data={uploadedData} 
            sheets={availableSheets}
            currentSheet={currentSheet}
            onSheetChange={handleSheetChange}
            onRegenerate={availableSheets.length > 0 ? handleRegenerate : undefined}
          />
        );
      case "summary":
        return (
          <DataSummary 
            data={uploadedData}
            sheets={availableSheets}
            currentSheet={currentSheet}
          />
        );
      case "insights":
        return <AIInsight data={uploadedData} />;
      case "visualization":
        return <DataVisualization data={uploadedData} />;
      case "documents":
        return <AIDocumentProcessor />;
      default:
        return <FileUpload onFileUpload={handleFileUpload} />;
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark">
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="cyber-card p-6 min-h-full">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-neon-blue glow-text mb-2">
                      Prism Data Nexus
                    </h1>
                    <p className="text-gray-400">
                      Advanced Analytics & Real-time Data Processing Platform
                    </p>
                  </div>
                  <AppSettings 
                    decimalPlaces={decimalPlaces}
                    onDecimalPlacesChange={setDecimalPlaces}
                  />
                </div>
              </div>
              {renderContent()}
            </div>
          </main>
        </div>
        
        {/* ChatBot Component */}
        <ChatBot 
          uploadedData={uploadedData}
          currentSheet={currentSheet}
        />
      </SidebarProvider>
    </div>
  );
};

export default Index;
