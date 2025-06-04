import React, { useState } from 'react';
import { Brain, Sparkles, TrendingUp, BarChart3, Database, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIInsightProps {
  data: any[];
}

// Initialize Google AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY || '');

export const AIInsight: React.FC<AIInsightProps> = ({ data }) => {
  const [insights, setInsights] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    if (data.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please upload data first to generate AI insights",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Prepare data summary for AI
      const dataSummary = {
        totalRows: data.length,
        columns: Object.keys(data[0] || {}),
        sampleData: data.slice(0, 5)
      };

      const prompt = `
        Analyze this dataset and provide comprehensive insights:
        
        Dataset Summary:
        - Total Records: ${dataSummary.totalRows}
        - Columns: ${dataSummary.columns.join(', ')}
        - Sample Data: ${JSON.stringify(dataSummary.sampleData, null, 2)}
        
        Please provide:
        1. Key patterns and trends
        2. Statistical insights
        3. Data quality observations
        4. Recommendations for further analysis
        5. Potential business insights
        
        Format the response in a clear, structured manner with headers and bullet points.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedInsights = response.text();
      
      setInsights(generatedInsights);
      
      toast({
        title: "Insights Generated!",
        description: "AI analysis completed successfully",
      });

    } catch (error) {
      console.error('Insight generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate insights. Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportInsights = () => {
    if (!insights) {
      toast({
        title: "No Insights to Export",
        description: "Please generate insights first",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([insights], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-insights-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Insights Exported!",
      description: "AI insights have been exported successfully",
    });
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Data for AI Analysis</h3>
        <p className="text-gray-500">Upload a dataset to get AI-powered insights and recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neon-blue glow-text">AI Insights</h2>
          <p className="text-gray-400">Advanced AI analysis of your data with actionable insights</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={generateInsights}
            disabled={isGenerating}
            className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Insights'}
          </Button>
          <Button
            onClick={exportInsights}
            disabled={!insights}
            className="neon-button"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card p-4">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-neon-blue" />
            <div>
              <p className="text-sm text-gray-400">Total Records</p>
              <p className="text-xl font-bold text-neon-blue">{data.length}</p>
            </div>
          </div>
        </div>
        
        <div className="cyber-card p-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-neon-green" />
            <div>
              <p className="text-sm text-gray-400">Columns</p>
              <p className="text-xl font-bold text-neon-green">{Object.keys(data[0] || {}).length}</p>
            </div>
          </div>
        </div>
        
        <div className="cyber-card p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-neon-orange" />
            <div>
              <p className="text-sm text-gray-400">Analysis Ready</p>
              <p className="text-xl font-bold text-neon-orange">✓</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Display */}
      <div className="cyber-card p-6">
        <h3 className="text-lg font-semibold text-neon-orange mb-4">AI Generated Insights</h3>
        
        {insights ? (
          <div className="bg-cyber-dark/60 p-6 rounded border border-neon-blue/30">
            <pre className="text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {insights}
            </pre>
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-neon-purple/50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready for AI Analysis</h3>
            <p className="text-gray-500 mb-4">Click "Generate Insights" to analyze your data with advanced AI</p>
            <div className="flex justify-center space-x-4 text-sm text-gray-400">
              <span>• Pattern Recognition</span>
              <span>• Statistical Analysis</span>
              <span>• Business Insights</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
