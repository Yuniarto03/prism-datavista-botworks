
import React from 'react';
import { useDrag } from 'react-dnd';
import { Database, Type } from 'lucide-react';

interface DraggableFieldProps {
  name: string;
  type: 'numeric' | 'text';
}

export const DraggableField: React.FC<DraggableFieldProps> = ({ name, type }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: { name, type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`
        flex items-center space-x-2 p-2 rounded border cursor-move transition-all
        ${isDragging 
          ? 'opacity-50 border-neon-blue bg-neon-blue/10' 
          : 'border-neon-purple/30 bg-cyber-light hover:bg-neon-purple/10'
        }
      `}
    >
      <div className={`w-3 h-3 rounded ${type === 'numeric' ? 'bg-neon-green' : 'bg-neon-orange'}`} />
      {type === 'numeric' ? <Database className="w-4 h-4 text-neon-green" /> : <Type className="w-4 h-4 text-neon-orange" />}
      <span className="text-white text-sm truncate flex-1">{name}</span>
    </div>
  );
};
