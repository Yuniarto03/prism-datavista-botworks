
import React from 'react';
import { useDrop } from 'react-dnd';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DroppedField {
  name: string;
  type: 'numeric' | 'text';
  aggregation?: string;
}

interface PivotDropZoneProps {
  title: string;
  fields: DroppedField[];
  onDrop: (field: DroppedField) => void;
  onRemove: (index: number) => void;
  onAggregationChange?: (index: number, aggregation: string) => void;
  allowAggregation?: boolean;
  icon: React.ReactNode;
  description: string;
}

export const PivotDropZone: React.FC<PivotDropZoneProps> = ({
  title,
  fields,
  onDrop,
  onRemove,
  onAggregationChange,
  allowAggregation = false,
  icon,
  description
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'field',
    drop: (item: DroppedField) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const aggregationOptions = [
    { value: 'sum', label: 'Sum' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
    { value: 'average', label: 'Average' },
    { value: 'sdev', label: 'Std Dev' },
    { value: 'mean', label: 'Mean' },
    { value: 'median', label: 'Median' }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-sm font-semibold text-neon-blue">
        {icon}
        <span>{title}</span>
      </div>
      
      <div
        ref={drop}
        className={`
          min-h-[80px] p-3 border-2 border-dashed rounded-lg transition-all duration-300
          ${isOver 
            ? 'border-neon-green bg-neon-green/10 shadow-lg shadow-neon-green/20' 
            : 'border-neon-blue/30 bg-cyber-light/30'
          }
          ${fields.length === 0 ? 'flex items-center justify-center' : ''}
        `}
      >
        {fields.length === 0 ? (
          <div className="text-center text-gray-400 text-xs">
            <div className="mb-1">{description}</div>
            <div className="text-xs opacity-70">Drag fields here</div>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={index} className="flex items-center space-x-2 bg-cyber-dark/60 p-2 rounded border border-neon-purple/30">
                <div className={`w-2 h-2 rounded-full ${field.type === 'numeric' ? 'bg-neon-green' : 'bg-neon-orange'}`} />
                <span className="text-white text-sm flex-1 truncate">{field.name}</span>
                
                {allowAggregation && field.type === 'numeric' && onAggregationChange && (
                  <Select 
                    value={field.aggregation || 'sum'} 
                    onValueChange={(value) => onAggregationChange(index, value)}
                  >
                    <SelectTrigger className="w-20 h-6 text-xs bg-neon-purple/20 border-neon-purple/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cyber-dark border-neon-purple/30 text-white">
                      {aggregationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <Button
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="w-6 h-6 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
