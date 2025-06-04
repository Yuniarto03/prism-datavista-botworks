
import React, { useState, useMemo } from 'react';
import { Brain, Download, FileText, TrendingUp, Search, AlertTriangle, Sparkles, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIResponseRenderer } from './AIResponseRenderer';

interface AIInsightProps {
  data: any[];
}

export const AIInsight: React.FC<AIInsightProps> = ({ data }) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const { toast } = useToast();

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const handleGenerateInsights = async () => {
    if (data.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please upload data first to generate insights",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Starting AI insights generation...');
      
      // Prepare data summary for AI analysis
      const dataSummary = {
        totalRows: data.length,
        columns: columns,
        sampleData: data.slice(0, 5), // Send first 5 rows as sample
        dataTypes: columns.reduce((acc, col) => {
          const sampleValues = data.slice(0, 10).map(row => row[col]);
          const hasNumbers = sampleValues.some(val => typeof val === 'number');
          const hasStrings = sampleValues.some(val => typeof val === 'string');
          acc[col] = hasNumbers ? 'numeric' : hasStrings ? 'categorical' : 'mixed';
          return acc;
        }, {} as Record<string, string>)
      };

      const analysisCommand = selectedColumn === 'all' 
        ? `Analisis dataset ini secara komprehensif. Dataset memiliki ${data.length} baris dengan kolom: ${columns.join(', ')}. Berikan insight mendalam, pola tersembunyi, anomali, tren, dan rekomendasi strategis. Sertakan visualisasi dalam bentuk grafik dan tabel untuk mendukung analisis.`
        : `Fokus analisis pada kolom "${selectedColumn}" dari dataset dengan ${data.length} baris. Berikan analisis mendalam tentang distribusi, pola, outlier, dan insight strategis untuk kolom ini. Sertakan visualisasi yang relevan.`;

      const { data: aiResponse, error } = await supabase.functions.invoke('ai-document-processor', {
        body: {
          command: analysisCommand,
          files: [{
            name: 'dataset.json',
            type: 'application/json',
            size: JSON.stringify(dataSummary).length,
            content: dataSummary
          }],
          analysisType: 'comprehensive_data_insights'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'AI analysis failed');
      }

      console.log('AI insights response:', aiResponse);
      setAiInsights(aiResponse);
      toast({
        title: "AI Insights Generated!",
        description: "Advanced analytics and insights have been generated successfully using real AI",
      });

    } catch (error) {
      console.error('AI insights error:', error);
      toast({
        title: "AI Analysis Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportAnalysis = async () => {
    if (!aiInsights) {
      toast({
        title: "No Insights to Export",
        description: "Please generate insights first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Create export data
      const exportData = {
        timestamp: new Date().toISOString(),
        dataset_info: {
          total_rows: data.length,
          columns: columns,
          selected_column: selectedColumn
        },
        ai_insights: aiInsights,
        raw_data_sample: data.slice(0, 100) // Include first 100 rows
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-insights-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Analysis Exported!",
        description: "AI insights have been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-neon-purple to-neon-blue rounded-full flex items-center justify-center">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Data for Analysis</h3>
        <p className="text-gray-500">Upload a dataset to generate AI insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-neon-purple animate-pulse" />
          <div>
            <h2 className="text-2xl font-bold text-neon-purple glow-text">Real AI Insights</h2>
            <p className="text-gray-400">Advanced analytics powered by OpenAI GPT-4o</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating Real AI Insights...' : 'Generate Real AI Insights'}
          </Button>
          <Button
            onClick={handleExportAnalysis}
            disabled={isAnalyzing || !aiInsights}
            className="neon-button"
          >
            <Download className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Exporting...' : 'Export Analysis'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={selectedColumn} onValueChange={setSelectedColumn}>
          <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
            <SelectValue placeholder="Focus on column" />
          </SelectTrigger>
          <SelectContent className="bg-cyber-light border-neon-purple/30 text-white">
            <SelectItem value="all">All Columns</SelectItem>
            {columns.map(column => (
              <SelectItem key={column} value={column}>
                {column}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="cyber-card p-6 text-center">
          <div className="inline-flex items-center space-x-3">
            <Brain className="w-6 h-6 text-neon-purple animate-spin" />
            <span className="text-neon-purple font-medium">🧠 Processing with OpenAI GPT-4o for real-time analysis...</span>
          </div>
          <div className="mt-4 max-w-md mx-auto">
            <div className="bg-cyber-gray rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-neon-purple to-neon-blue animate-pulse w-3/4" />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">Generating comprehensive insights, patterns, and recommendations...</p>
        </div>
      )}

      {/* AI Insights Results */}
      {aiInsights && (
        <div className="space-y-6">
          <div className="cyber-card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-neon-green" />
              <h3 className="text-lg font-semibold text-neon-green">Real AI Analysis Results</h3>
              <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-1 rounded">Powered by OpenAI GPT-4o</span>
            </div>
            <AIResponseRenderer response={aiInsights} />
          </div>
        </div>
      )}

      {/* Empty State when no insights generated yet */}
      {!aiInsights && !isGenerating && (
        <div className="cyber-card p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-neon-purple opacity-50" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready for Real AI Analysis</h3>
          <p className="text-gray-500 mb-4">Click "Generate Real AI Insights" to analyze your data with OpenAI GPT-4o and get comprehensive insights</p>
          <div className="text-sm text-gray-600">
            <p>✅ Real AI processing (no simulation)</p>
            <p>✅ Advanced pattern recognition</p>
            <p>✅ Strategic recommendations</p>
            <p>✅ Multi-format visualizations</p>
          </div>
        </div>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="cyber-card p-6 text-center">
          <div className="inline-flex items-center space-x-3">
            <Brain className="w-6 h-6 text-neon-purple animate-spin" />
            <span className="text-neon-purple font-medium">Exporting comprehensive analysis...</span>
          </div>
          <div className="mt-4 max-w-md mx-auto">
            <div className="bg-cyber-gray rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-neon-purple to-neon-blue animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
