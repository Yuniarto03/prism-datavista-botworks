
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText, BarChart3, Image, Table, Lightbulb, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AIResponse {
  analysis?: string;
  insights?: string[];
  recommendations?: string[];
  visualData?: any;
  imagePrompt?: string;
  format?: 'text' | 'table' | 'chart' | 'image' | 'mixed';
  timestamp?: string;
  filesProcessed?: number;
  processingTime?: number;
  model?: string;
}

interface AIResponseRendererProps {
  response: AIResponse;
}

export const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({ response }) => {
  const formatDate = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  const renderVisualization = () => {
    if (!response.visualData) return null;

    const { type, data } = response.visualData;

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#e2e8f0" />
              <YAxis stroke="#e2e8f0" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #00D4FF',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }} 
              />
              <Bar dataKey="value" fill="url(#gradient)" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#e2e8f0" />
              <YAxis stroke="#e2e8f0" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #00D4FF',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }} 
              />
              <Line type="monotone" dataKey="value" stroke="#00D4FF" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const COLORS = ['#00D4FF', '#8B5CF6', '#00FF88', '#FF6B35'];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderDataTable = () => {
    if (!response.visualData?.tableData) return null;

    const { headers, rows } = response.visualData.tableData;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neon-blue/30">
              {headers.map((header: string, index: number) => (
                <th key={index} className="text-left p-3 text-neon-blue font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any[], rowIndex: number) => (
              <tr key={rowIndex} className="border-b border-gray-700 hover:bg-cyber-gray/30">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-3 text-gray-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-neon-purple" />
          <h3 className="text-xl font-bold text-neon-purple">AI Analysis Results</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          {response.timestamp && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(response.timestamp)}
            </div>
          )}
          {response.model && (
            <Badge variant="outline" className="border-neon-blue text-neon-blue">
              {response.model}
            </Badge>
          )}
          {response.filesProcessed !== undefined && (
            <Badge variant="outline" className="border-neon-green text-neon-green">
              {response.filesProcessed} files processed
            </Badge>
          )}
        </div>
      </div>

      {/* Main Analysis */}
      {response.analysis && (
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-neon-blue flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {response.analysis}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {response.insights && response.insights.length > 0 && (
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-neon-green flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {response.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-neon-green rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-300">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Visualizations */}
      {response.visualData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charts */}
          {response.visualData.type && (
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-neon-orange flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Data Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderVisualization()}
              </CardContent>
            </Card>
          )}

          {/* Tables */}
          {response.visualData.tableData && (
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-neon-purple flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  Data Table
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderDataTable()}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Image Generation */}
      {response.imagePrompt && (
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-neon-blue flex items-center gap-2">
              <Image className="w-5 h-5" />
              Generated Image Concept
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-cyber-dark p-4 rounded-lg border border-neon-blue/30">
              <p className="text-gray-300 italic">
                Image concept: {response.imagePrompt}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Note: Image generation can be implemented with additional API integration
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {response.recommendations && response.recommendations.length > 0 && (
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-neon-orange flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {response.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-neon-orange rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-300">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
