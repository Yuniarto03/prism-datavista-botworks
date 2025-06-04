
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Plus, Download, Sparkles, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableField } from '@/components/pivot/DraggableField';
import { useToast } from '@/hooks/use-toast';

interface TimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  status: 'planned' | 'in-progress' | 'completed';
}

interface TimelineGeneratorProps {
  data: any[];
}

export const TimelineGenerator: React.FC<TimelineGeneratorProps> = ({ data }) => {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedDateField, setSelectedDateField] = useState<string>('');
  const [selectedTitleField, setSelectedTitleField] = useState<string>('');
  const [selectedDescField, setSelectedDescField] = useState<string>('');
  const [themeStyle, setThemeStyle] = useState<'modern' | 'classic' | 'minimal'>('modern');
  const [newItem, setNewItem] = useState({
    title: '',
    date: '',
    description: '',
    category: 'milestone',
    status: 'planned' as const
  });
  const [isEditing, setIsEditing] = useState<string>('');
  const { toast } = useToast();

  // Get available fields from data
  const availableFields = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).map(key => ({
      name: key,
      type: 'text' as const
    }));
  }, [data]);

  const dateFields = useMemo(() => {
    return availableFields.filter(field => {
      if (data.length === 0) return false;
      const sampleValue = data[0][field.name];
      return sampleValue && (
        typeof sampleValue === 'string' && 
        (sampleValue.includes('/') || sampleValue.includes('-') || !isNaN(Date.parse(sampleValue)))
      );
    });
  }, [availableFields, data]);

  const handleGenerateFromData = () => {
    if (!selectedDateField || !selectedTitleField) {
      toast({
        title: "Missing Fields",
        description: "Please select date and title fields to generate timeline",
        variant: "destructive",
      });
      return;
    }

    const generatedItems: TimelineItem[] = data.slice(0, 20).map((row, index) => ({
      id: `generated-${index}`,
      title: String(row[selectedTitleField] || `Item ${index + 1}`),
      date: String(row[selectedDateField] || new Date().toISOString().split('T')[0]),
      description: selectedDescField ? String(row[selectedDescField] || '') : `Generated from data row ${index + 1}`,
      category: 'data-point',
      status: 'completed' as const
    }));

    setTimelineItems(generatedItems);
    toast({
      title: "Timeline Generated!",
      description: `Created ${generatedItems.length} timeline items from your data`,
    });
  };

  const handleAddItem = () => {
    if (!newItem.title || !newItem.date) {
      toast({
        title: "Missing Information",
        description: "Please provide title and date for the timeline item",
        variant: "destructive",
      });
      return;
    }

    const item: TimelineItem = {
      id: `manual-${Date.now()}`,
      ...newItem
    };

    setTimelineItems(prev => [...prev, item].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setNewItem({
      title: '',
      date: '',
      description: '',
      category: 'milestone',
      status: 'planned'
    });

    toast({
      title: "Item Added!",
      description: "Timeline item has been added successfully",
    });
  };

  const handleDeleteItem = (id: string) => {
    setTimelineItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item Deleted",
      description: "Timeline item has been removed",
    });
  };

  const handleExportTimeline = () => {
    const exportData = {
      timeline: timelineItems,
      theme: themeStyle,
      generatedAt: new Date().toISOString(),
      fields: {
        date: selectedDateField,
        title: selectedTitleField,
        description: selectedDescField
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Timeline Exported!",
      description: "Timeline has been exported successfully",
    });
  };

  const getThemeClasses = () => {
    switch (themeStyle) {
      case 'classic':
        return {
          container: 'bg-gradient-to-br from-amber-50 to-orange-100',
          item: 'bg-white border-amber-300 shadow-amber-100',
          line: 'bg-amber-400',
          dot: 'bg-amber-500'
        };
      case 'minimal':
        return {
          container: 'bg-gray-50',
          item: 'bg-white border-gray-200 shadow-gray-100',
          line: 'bg-gray-300',
          dot: 'bg-gray-400'
        };
      default: // modern
        return {
          container: 'bg-gradient-to-br from-cyber-dark to-cyber-gray',
          item: 'bg-cyber-light border-neon-blue/30 shadow-neon-blue/10',
          line: 'bg-neon-blue',
          dot: 'bg-neon-purple'
        };
    }
  };

  const themeClasses = getThemeClasses();

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Data for Timeline</h3>
        <p className="text-gray-500">Upload a dataset to generate custom timelines and milestones</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neon-blue glow-text">Timeline Generator</h2>
            <p className="text-gray-400">Create custom timelines and milestones from your data</p>
          </div>
          <div className="flex space-x-2">
            <Select value={themeStyle} onValueChange={(value: any) => setThemeStyle(value)}>
              <SelectTrigger className="w-32 bg-cyber-light border-neon-purple/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cyber-dark border-neon-purple/30 text-white">
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExportTimeline}
              disabled={timelineItems.length === 0}
              className="neon-button"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Field Selection */}
            <div className="cyber-card p-4">
              <h3 className="text-lg font-semibold text-neon-green mb-4">Data Mapping</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Date Field</label>
                  <Select value={selectedDateField} onValueChange={setSelectedDateField}>
                    <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                      <SelectValue placeholder="Select date field" />
                    </SelectTrigger>
                    <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                      {dateFields.map(field => (
                        <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Title Field</label>
                  <Select value={selectedTitleField} onValueChange={setSelectedTitleField}>
                    <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                      <SelectValue placeholder="Select title field" />
                    </SelectTrigger>
                    <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                      {availableFields.map(field => (
                        <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Description Field (Optional)</label>
                  <Select value={selectedDescField} onValueChange={setSelectedDescField}>
                    <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                      <SelectValue placeholder="Select description field" />
                    </SelectTrigger>
                    <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                      <SelectItem value="">None</SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field.name} value={field.name}>{field.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerateFromData}
                  className="w-full bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate from Data
                </Button>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="cyber-card p-4">
              <h3 className="text-lg font-semibold text-neon-orange mb-4">Add Manual Item</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Title"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-cyber-light border-neon-blue/30 text-white"
                />
                <Input
                  type="date"
                  value={newItem.date}
                  onChange={(e) => setNewItem(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-cyber-light border-neon-blue/30 text-white"
                />
                <Input
                  placeholder="Description"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-cyber-light border-neon-blue/30 text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newItem.status} onValueChange={(value: any) => setNewItem(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="bg-cyber-light border-neon-blue/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cyber-dark border-neon-blue/30 text-white">
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddItem}
                  className="w-full bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline Display */}
          <div className="lg:col-span-2">
            <div className={`cyber-card p-6 ${themeClasses.container} min-h-[600px]`}>
              <h3 className="text-lg font-semibold text-neon-blue mb-6">Timeline Visualization</h3>
              
              {timelineItems.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Timeline Items</h3>
                  <p className="text-gray-500">Generate from data or add manual items to create your timeline</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className={`absolute left-8 top-0 bottom-0 w-0.5 ${themeClasses.line}`} />
                  
                  {/* Timeline Items */}
                  <div className="space-y-6">
                    {timelineItems.map((item, index) => (
                      <div key={item.id} className="relative flex items-start">
                        {/* Timeline Dot */}
                        <div className={`w-4 h-4 rounded-full ${themeClasses.dot} border-2 border-white shadow-lg z-10`} />
                        
                        {/* Timeline Content */}
                        <div className={`ml-6 flex-1 p-4 rounded-lg border shadow-lg ${themeClasses.item}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold text-lg text-white">{item.title}</h4>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                  item.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {item.status}
                                </span>
                                <span className="px-2 py-1 rounded text-xs bg-neon-purple/20 text-neon-purple">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-gray-300 mb-2">{item.description}</p>
                              <div className="flex items-center text-sm text-gray-400">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(item.date).toLocaleDateString()}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDeleteItem(item.id)}
                              size="sm"
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
