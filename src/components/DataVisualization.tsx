import React, { useState, useMemo } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart, RefreshCw, ZoomIn } from 'lucide-react';
import { ResponsiveContainer, BarChart, LineChart as RechartsLineChart, AreaChart, PieChart, ScatterChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Bar, Line, Area, Pie, Cell, Scatter, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartZoomModal } from './ChartZoomModal';
import { useToast } from '@/hooks/use-toast';

interface DataVisualizationProps {
  data: any[];
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({ data }) => {
  // Chart 1 state
  const [chartType1, setChartType1] = useState('please-select');
  const [xAxis1, setXAxis1] = useState('please-select');
  const [yAxis1, setYAxis1] = useState('please-select');
  const [yAxis2_1, setYAxis2_1] = useState('please-select');
  const [aggregation1, setAggregation1] = useState('please-select');
  const [filterHeader1_1, setFilterHeader1_1] = useState('please-select');
  const [filterValues1_1, setFilterValues1_1] = useState<string[]>([]);
  const [filterHeader1_2, setFilterHeader1_2] = useState('please-select');
  const [filterValues1_2, setFilterValues1_2] = useState<string[]>([]);
  const [colorTheme1, setColorTheme1] = useState('please-select');
  const [chartData1, setChartData1] = useState<any[]>([]);
  const [showChart1, setShowChart1] = useState(false);

  // Chart 2 state
  const [chartType2, setChartType2] = useState('please-select');
  const [xAxis2, setXAxis2] = useState('please-select');
  const [yAxis2, setYAxis2] = useState('please-select');
  const [yAxis2_2, setYAxis2_2] = useState('please-select');
  const [aggregation2, setAggregation2] = useState('please-select');
  const [filterHeader2_1, setFilterHeader2_1] = useState('please-select');
  const [filterValues2_1, setFilterValues2_1] = useState<string[]>([]);
  const [filterHeader2_2, setFilterHeader2_2] = useState('please-select');
  const [filterValues2_2, setFilterValues2_2] = useState<string[]>([]);
  const [colorTheme2, setColorTheme2] = useState('please-select');
  const [chartData2, setChartData2] = useState<any[]>([]);
  const [showChart2, setShowChart2] = useState(false);

  // Zoom modal state
  const [zoomModal, setZoomModal] = useState({ isOpen: false, chartNumber: 1 });

  const { toast } = useToast();

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Function to get unique values for a column
  const getUniqueValues = (column: string) => {
    if (!column || column === 'please-select') return [];
    const values = [...new Set(data.map(row => row[column]))];
    return values.filter(value => value !== undefined && value !== null && value !== '').map(String);
  };

  const availableFilterValues1_1 = useMemo(() => getUniqueValues(filterHeader1_1), [data, filterHeader1_1]);
  const availableFilterValues1_2 = useMemo(() => getUniqueValues(filterHeader1_2), [data, filterHeader1_2]);
  const availableFilterValues2_1 = useMemo(() => getUniqueValues(filterHeader2_1), [data, filterHeader2_1]);
  const availableFilterValues2_2 = useMemo(() => getUniqueValues(filterHeader2_2), [data, filterHeader2_2]);

  const processChartData = (
    xAxis: string,
    yAxis1: string,
    yAxis2: string,
    aggregation: string,
    filterHeader1: string,
    filterValues1: string[],
    filterHeader2: string,
    filterValues2: string[]
  ) => {
    if (xAxis === 'please-select' || yAxis1 === 'please-select' || aggregation === 'please-select') {
      return [];
    }

    let filteredData = data;

    // Apply filters
    if (filterHeader1 !== 'please-select' && filterValues1.length > 0) {
      filteredData = filteredData.filter(row => filterValues1.includes(String(row[filterHeader1])));
    }
    
    if (filterHeader2 !== 'please-select' && filterValues2.length > 0) {
      filteredData = filteredData.filter(row => filterValues2.includes(String(row[filterHeader2])));
    }

    // Group by x-axis
    const groupedData = filteredData.reduce((acc, row) => {
      const key = String(row[xAxis]);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    // Apply aggregation
    const processedData = Object.keys(groupedData).map(key => {
      const group = groupedData[key];
      const result: any = { [xAxis]: key };

      // Process yAxis1
      const values1 = group.map(row => row[yAxis1]).filter(val => val !== null && val !== undefined && val !== '');
      result[yAxis1] = applyAggregation(values1, aggregation);

      // Process yAxis2 if provided
      if (yAxis2 !== 'please-select') {
        const values2 = group.map(row => row[yAxis2]).filter(val => val !== null && val !== undefined && val !== '');
        result[yAxis2] = applyAggregation(values2, aggregation);
      }

      return result;
    });

    return processedData.filter(item => 
      item[yAxis1] !== undefined && 
      item[yAxis1] !== null && 
      !isNaN(Number(item[yAxis1]))
    );
  };

  const applyAggregation = (values: any[], aggregation: string) => {
    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0);
      case 'count':
        return values.length;
      case 'count-non-empty':
        return values.filter(val => val !== '' && val !== null && val !== undefined).length;
      case 'average':
        const numericValues = values.filter(val => !isNaN(Number(val))).map(Number);
        return numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
      case 'min':
        const minValues = values.filter(val => !isNaN(Number(val))).map(Number);
        return minValues.length > 0 ? Math.min(...minValues) : 0;
      case 'max':
        const maxValues = values.filter(val => !isNaN(Number(val))).map(Number);
        return maxValues.length > 0 ? Math.max(...maxValues) : 0;
      case 'unique-count':
        return [...new Set(values)].length;
      case 'sdev':
        const sdevValues = values.filter(val => !isNaN(Number(val))).map(Number);
        if (sdevValues.length <= 1) return 0;
        const mean = sdevValues.reduce((sum, val) => sum + val, 0) / sdevValues.length;
        const variance = sdevValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sdevValues.length;
        return Math.sqrt(variance);
      default:
        return 0;
    }
  };

  const generateChart1 = () => {
    const processedData = processChartData(xAxis1, yAxis1, yAxis2_1, aggregation1, filterHeader1_1, filterValues1_1, filterHeader1_2, filterValues1_2);
    setChartData1(processedData);
    setShowChart1(true);
    toast({
      title: "Chart 1 Generated!",
      description: `Generated ${chartType1} chart with ${processedData.length} data points`,
    });
  };

  const generateChart2 = () => {
    const processedData = processChartData(xAxis2, yAxis2, yAxis2_2, aggregation2, filterHeader2_1, filterValues2_1, filterHeader2_2, filterValues2_2);
    setChartData2(processedData);
    setShowChart2(true);
    toast({
      title: "Chart 2 Generated!",
      description: `Generated ${chartType2} chart with ${processedData.length} data points`,
    });
  };

  const resetChart1 = () => {
    setChartData1([]);
    setShowChart1(false);
    toast({
      title: "Chart 1 Reset",
      description: "Chart 1 has been cleared",
    });
  };

  const resetChart2 = () => {
    setChartData2([]);
    setShowChart2(false);
    toast({
      title: "Chart 2 Reset", 
      description: "Chart 2 has been cleared",
    });
  };

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

  const renderChart = (
    chartType: string,
    chartData: any[],
    xAxis: string,
    yAxis1: string,
    yAxis2: string,
    colorTheme: string
  ) => {
    if (!chartData || chartData.length === 0) return null;

    const colors = getThemeColors(colorTheme);
    const chartProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={xAxis} stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Bar dataKey={yAxis1} fill={colors[0]} opacity={0.8} />
            {yAxis2 !== 'please-select' && <Bar dataKey={yAxis2} fill={colors[1]} opacity={0.8} />}
          </BarChart>
        );

      case 'line':
        return (
          <RechartsLineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={xAxis} stroke="#fff" />
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
              dataKey={yAxis1} 
              stroke={colors[0]} 
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 6 }}
            />
            {yAxis2 !== 'please-select' && (
              <Line 
                type="monotone" 
                dataKey={yAxis2} 
                stroke={colors[1]} 
                strokeWidth={3}
                dot={{ fill: colors[1], strokeWidth: 2, r: 6 }}
              />
            )}
          </RechartsLineChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={xAxis} stroke="#fff" />
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
              dataKey={yAxis1} 
              stroke={colors[0]} 
              fill={colors[0]} 
              fillOpacity={0.6}
            />
            {yAxis2 !== 'please-select' && (
              <Area 
                type="monotone" 
                dataKey={yAxis2} 
                stroke={colors[1]} 
                fill={colors[1]} 
                fillOpacity={0.6}
              />
            )}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart width={400} height={300}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey={yAxis1}
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
            <XAxis dataKey={xAxis} stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Scatter dataKey={yAxis1} fill={colors[0]} />
            {yAxis2 !== 'please-select' && <Scatter dataKey={yAxis2} fill={colors[1]} />}
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData} width={400} height={300}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey={xAxis} stroke="#fff" />
            <PolarRadiusAxis stroke="#fff" />
            <Radar 
              dataKey={yAxis1} 
              stroke={colors[0]} 
              fill={colors[0]} 
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {yAxis2 !== 'please-select' && (
              <Radar 
                dataKey={yAxis2} 
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neon-blue glow-text">Data Visualization</h2>
        <p className="text-gray-400">Configure your charts below</p>
      </div>

      {/* Chart Controls - Landscape Layout */}
      <div className="space-y-8">
        {/* Chart 1 */}
        <div className="space-y-6">
          <div className="cyber-card p-6">
            <h3 className="text-lg font-semibold text-neon-blue mb-4">Chart 1 Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {/* Chart Type */}
              <div>
                <Label className="text-neon-blue mb-2 block">Chart Type</Label>
                <Select value={chartType1} onValueChange={setChartType1}>
                  <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                    <SelectItem value="radar">Radar Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* X Axis */}
              <div>
                <Label className="text-neon-blue mb-2 block">X Axis</Label>
                <Select value={xAxis1} onValueChange={setXAxis1}>
                  <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Y Axis 1 */}
              <div>
                <Label className="text-neon-blue mb-2 block">Y Axis 1</Label>
                <Select value={yAxis1} onValueChange={setYAxis1}>
                  <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Y Axis 2 (Optional) */}
              <div>
                <Label className="text-neon-blue mb-2 block">Y Axis 2 (Optional)</Label>
                <Select value={yAxis2_1} onValueChange={setYAxis2_1}>
                  <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aggregation */}
              <div>
                <Label className="text-neon-blue mb-2 block">Aggregation</Label>
                <Select value={aggregation1} onValueChange={setAggregation1}>
                  <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="count-non-empty">Count Non Empty</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="min">Min</SelectItem>
                    <SelectItem value="max">Max</SelectItem>
                    <SelectItem value="unique-count">Unique Count</SelectItem>
                    <SelectItem value="sdev">Standard Deviation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Filter Header 1 */}
              <div>
                <Label className="text-neon-blue mb-2 block">Filter Header 1</Label>
                <Select value={filterHeader1_1} onValueChange={(value) => {
                  setFilterHeader1_1(value);
                  setFilterValues1_1([]);
                }}>
                  <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Values 1 */}
              {filterHeader1_1 !== 'please-select' && availableFilterValues1_1.length > 0 && (
                <div>
                  <Label className="text-neon-blue mb-2 block">Filter Values 1</Label>
                  <div className="max-h-32 overflow-y-auto border border-neon-blue/30 rounded p-2">
                    {availableFilterValues1_1.map(value => (
                      <div key={value} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`filter1_1-${value}`}
                          checked={filterValues1_1.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterValues1_1([...filterValues1_1, value]);
                            } else {
                              setFilterValues1_1(filterValues1_1.filter(v => v !== value));
                            }
                          }}
                          className="border-neon-blue data-[state=checked]:bg-neon-blue"
                        />
                        <Label htmlFor={`filter1_1-${value}`} className="text-xs text-white cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Header 2 */}
              <div>
                <Label className="text-neon-blue mb-2 block">Filter Header 2</Label>
                <Select value={filterHeader1_2} onValueChange={(value) => {
                  setFilterHeader1_2(value);
                  setFilterValues1_2([]);
                }}>
                  <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Values 2 */}
              {filterHeader1_2 !== 'please-select' && availableFilterValues1_2.length > 0 && (
                <div>
                  <Label className="text-neon-blue mb-2 block">Filter Values 2</Label>
                  <div className="max-h-32 overflow-y-auto border border-neon-blue/30 rounded p-2">
                    {availableFilterValues1_2.map(value => (
                      <div key={value} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`filter1_2-${value}`}
                          checked={filterValues1_2.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterValues1_2([...filterValues1_2, value]);
                            } else {
                              setFilterValues1_2(filterValues1_2.filter(v => v !== value));
                            }
                          }}
                          className="border-neon-blue data-[state=checked]:bg-neon-blue"
                        />
                        <Label htmlFor={`filter1_2-${value}`} className="text-xs text-white cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Theme */}
              <div>
                <Label className="text-neon-blue mb-2 block">Color Theme</Label>
                <Select value={colorTheme1} onValueChange={setColorTheme1}>
                  <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white focus:border-neon-blue">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-blue/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="cyber">Cyber</SelectItem>
                    <SelectItem value="matrix">Matrix</SelectItem>
                    <SelectItem value="plasma">Plasma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={generateChart1}
                className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Chart
              </Button>
              <Button
                onClick={resetChart1}
                variant="outline"
                className="border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Chart 1 Display */}
          {showChart1 && chartData1.length > 0 && (
            <div className="cyber-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-neon-blue">Chart 1 - {chartType1.charAt(0).toUpperCase() + chartType1.slice(1)} Chart</h4>
                <Button
                  onClick={() => setZoomModal({ isOpen: true, chartNumber: 1 })}
                  size="sm"
                  className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30"
                >
                  <ZoomIn className="w-4 h-4 mr-2" />
                  Zoom
                </Button>
              </div>
              <div className="bg-cyber-light/50 rounded-lg p-4" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart(chartType1, chartData1, xAxis1, yAxis1, yAxis2_1, colorTheme1)}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Chart 2 */}
        <div className="space-y-6">
          <div className="cyber-card p-6">
            <h3 className="text-lg font-semibold text-neon-purple mb-4">Chart 2 Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {/* Chart Type */}
              <div>
                <Label className="text-neon-purple mb-2 block">Chart Type</Label>
                <Select value={chartType2} onValueChange={setChartType2}>
                  <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                    <SelectItem value="radar">Radar Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* X Axis */}
              <div>
                <Label className="text-neon-purple mb-2 block">X Axis</Label>
                <Select value={xAxis2} onValueChange={setXAxis2}>
                  <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Y Axis 1 */}
              <div>
                <Label className="text-neon-purple mb-2 block">Y Axis 1</Label>
                <Select value={yAxis2} onValueChange={setYAxis2}>
                  <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Y Axis 2 (Optional) */}
              <div>
                <Label className="text-neon-purple mb-2 block">Y Axis 2 (Optional)</Label>
                <Select value={yAxis2_2} onValueChange={setYAxis2_2}>
                  <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aggregation */}
              <div>
                <Label className="text-neon-purple mb-2 block">Aggregation</Label>
                <Select value={aggregation2} onValueChange={setAggregation2}>
                  <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="count-non-empty">Count Non Empty</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="min">Min</SelectItem>
                    <SelectItem value="max">Max</SelectItem>
                    <SelectItem value="unique-count">Unique Count</SelectItem>
                    <SelectItem value="sdev">Standard Deviation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Filter Header 1 */}
              <div>
                <Label className="text-neon-purple mb-2 block">Filter Header 1</Label>
                <Select value={filterHeader2_1} onValueChange={(value) => {
                  setFilterHeader2_1(value);
                  setFilterValues2_1([]);
                }}>
                  <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Values 1 */}
              {filterHeader2_1 !== 'please-select' && availableFilterValues2_1.length > 0 && (
                <div>
                  <Label className="text-neon-purple mb-2 block">Filter Values 1</Label>
                  <div className="max-h-32 overflow-y-auto border border-neon-purple/30 rounded p-2">
                    {availableFilterValues2_1.map(value => (
                      <div key={value} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`filter2_1-${value}`}
                          checked={filterValues2_1.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterValues2_1([...filterValues2_1, value]);
                            } else {
                              setFilterValues2_1(filterValues2_1.filter(v => v !== value));
                            }
                          }}
                          className="border-neon-purple data-[state=checked]:bg-neon-purple"
                        />
                        <Label htmlFor={`filter2_1-${value}`} className="text-xs text-white cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Header 2 */}
              <div>
                <Label className="text-neon-purple mb-2 block">Filter Header 2</Label>
                <Select value={filterHeader2_2} onValueChange={(value) => {
                  setFilterHeader2_2(value);
                  setFilterValues2_2([]);
                }}>
                  <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Values 2 */}
              {filterHeader2_2 !== 'please-select' && availableFilterValues2_2.length > 0 && (
                <div>
                  <Label className="text-neon-purple mb-2 block">Filter Values 2</Label>
                  <div className="max-h-32 overflow-y-auto border border-neon-purple/30 rounded p-2">
                    {availableFilterValues2_2.map(value => (
                      <div key={value} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`filter2_2-${value}`}
                          checked={filterValues2_2.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterValues2_2([...filterValues2_2, value]);
                            } else {
                              setFilterValues2_2(filterValues2_2.filter(v => v !== value));
                            }
                          }}
                          className="border-neon-purple data-[state=checked]:bg-neon-purple"
                        />
                        <Label htmlFor={`filter2_2-${value}`} className="text-xs text-white cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Theme */}
              <div>
                <Label className="text-neon-purple mb-2 block">Color Theme</Label>
                <Select value={colorTheme2} onValueChange={setColorTheme2}>
                  <SelectTrigger className="bg-cyber-light border-neon-purple/30 text-white focus:border-neon-purple">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-light border-neon-purple/30 text-white z-50">
                    <SelectItem value="please-select">Please select</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="cyber">Cyber</SelectItem>
                    <SelectItem value="matrix">Matrix</SelectItem>
                    <SelectItem value="plasma">Plasma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={generateChart2}
                className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30"
              >
                <LineChart className="w-4 h-4 mr-2" />
                Generate Chart
              </Button>
              <Button
                onClick={resetChart2}
                variant="outline"
                className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Chart 2 Display */}
          {showChart2 && chartData2.length > 0 && (
            <div className="cyber-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-neon-purple">Chart 2 - {chartType2.charAt(0).toUpperCase() + chartType2.slice(1)} Chart</h4>
                <Button
                  onClick={() => setZoomModal({ isOpen: true, chartNumber: 2 })}
                  size="sm"
                  className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30"
                >
                  <ZoomIn className="w-4 h-4 mr-2" />
                  Zoom
                </Button>
              </div>
              <div className="bg-cyber-light/50 rounded-lg p-4" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart(chartType2, chartData2, xAxis2, yAxis2, yAxis2_2, colorTheme2)}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Modal */}
      <ChartZoomModal
        isOpen={zoomModal.isOpen}
        onClose={() => setZoomModal({ isOpen: false, chartNumber: 1 })}
        chartData={zoomModal.chartNumber === 1 ? chartData1 : chartData2}
        chartConfig={{
          type: zoomModal.chartNumber === 1 ? chartType1 : chartType2,
          xAxis: zoomModal.chartNumber === 1 ? xAxis1 : xAxis2,
          yAxis1: zoomModal.chartNumber === 1 ? yAxis1 : yAxis2,
          yAxis2: zoomModal.chartNumber === 1 ? yAxis2_1 : yAxis2_2,
          colorTheme: zoomModal.chartNumber === 1 ? colorTheme1 : colorTheme2
        }}
        title={`Chart ${zoomModal.chartNumber}`}
      />
    </div>
  );
};
