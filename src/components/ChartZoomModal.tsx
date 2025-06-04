
import React from 'react';
import { X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, LineChart, AreaChart, PieChart, ScatterChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Bar, Line, Area, Pie, Cell, Scatter, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ChartZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: any[];
  chartConfig: {
    type: string;
    xAxis: string;
    yAxis1: string;
    yAxis2?: string;
    colorTheme: string;
  };
  title: string;
}

export const ChartZoomModal: React.FC<ChartZoomModalProps> = ({
  isOpen,
  onClose,
  chartData,
  chartConfig,
  title
}) => {
  if (!isOpen) return null;

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'neon':
        return ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff4444'];
      case 'cyber':
        return ['#0ff', '#f0f', '#ff0', '#0f0', '#f44'];
      case 'matrix':
        return ['#00ff00', '#009900', '#006600', '#003300', '#001100'];
      case 'plasma':
        return ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'];
      default:
        return ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
    }
  };

  const colors = getThemeColors(chartConfig.colorTheme);

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    const chartProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartConfig.type) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={chartConfig.xAxis} stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Bar dataKey={chartConfig.yAxis1} fill={colors[0]} opacity={0.8} />
            {chartConfig.yAxis2 && <Bar dataKey={chartConfig.yAxis2} fill={colors[1]} opacity={0.8} />}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={chartConfig.xAxis} stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={chartConfig.yAxis1} 
              stroke={colors[0]} 
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 6 }}
            />
            {chartConfig.yAxis2 && (
              <Line 
                type="monotone" 
                dataKey={chartConfig.yAxis2} 
                stroke={colors[1]} 
                strokeWidth={3}
                dot={{ fill: colors[1], strokeWidth: 2, r: 6 }}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={chartConfig.xAxis} stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey={chartConfig.yAxis1} 
              stroke={colors[0]} 
              fill={colors[0]} 
              fillOpacity={0.6}
            />
            {chartConfig.yAxis2 && (
              <Area 
                type="monotone" 
                dataKey={chartConfig.yAxis2} 
                stroke={colors[1]} 
                fill={colors[1]} 
                fillOpacity={0.6}
              />
            )}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart width={600} height={400}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={150}
              fill="#8884d8"
              dataKey={chartConfig.yAxis1}
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px'
              }} 
            />
            <Legend />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={chartConfig.xAxis} stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Scatter dataKey={chartConfig.yAxis1} fill={colors[0]} />
            {chartConfig.yAxis2 && <Scatter dataKey={chartConfig.yAxis2} fill={colors[1]} />}
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData} width={600} height={400}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey={chartConfig.xAxis} stroke="#fff" />
            <PolarRadiusAxis stroke="#fff" />
            <Radar 
              dataKey={chartConfig.yAxis1} 
              stroke={colors[0]} 
              fill={colors[0]} 
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {chartConfig.yAxis2 && (
              <Radar 
                dataKey={chartConfig.yAxis2} 
                stroke={colors[1]} 
                fill={colors[1]} 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            )}
            <Legend />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px'
              }} 
            />
          </RadarChart>
        );

      default:
        return <div className="text-white">Unsupported chart type</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cyber-dark border border-neon-blue/30 rounded-lg max-w-6xl max-h-[90vh] w-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-neon-blue/30">
          <div className="flex items-center space-x-2">
            <ZoomIn className="w-6 h-6 text-neon-blue" />
            <h2 className="text-xl font-bold text-neon-blue">{title} - Zoomed View</h2>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <div className="bg-cyber-light/50 rounded-lg p-4" style={{ minHeight: '500px' }}>
            <ResponsiveContainer width="100%" height={500}>
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
