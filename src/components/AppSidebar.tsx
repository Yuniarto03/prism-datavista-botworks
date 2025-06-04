
import { 
  Database, 
  FileText, 
  FileChartColumn, 
  FileChartPie,
  DatabaseZap,
  Brain,
  Calendar
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    title: "Upload Data",
    icon: Database,
    id: "upload",
    description: "Upload large datasets",
    color: "text-neon-blue",
  },
  {
    title: "Data Table",
    icon: FileText,
    id: "table",
    description: "View and manage data",
    color: "text-neon-green",
  },
  {
    title: "Data Summary",
    icon: FileChartColumn,
    id: "summary",
    description: "Create data summaries",
    color: "text-neon-purple",
  },
  {
    title: "AI Insights",
    icon: DatabaseZap,
    id: "insights",
    description: "AI-powered analysis",
    color: "text-neon-orange",
  },
  {
    title: "Visualization",
    icon: FileChartPie,
    id: "visualization",
    description: "3D Charts & Graphs",
    color: "text-neon-blue",
  },
  {
    title: "AI Documents",
    icon: Brain,
    id: "documents",
    description: "AI Document Processing",
    color: "text-neon-green",
  },
  {
    title: "Timeline Generator",
    icon: Calendar,
    id: "timeline",
    description: "Custom Timeline/Milestone",
    color: "text-neon-orange",
  },
];

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-neon-blue/30 bg-gradient-to-b from-cyber-dark to-cyber-gray">
      <SidebarHeader className="p-4 border-b border-neon-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg flex items-center justify-center animate-glow-pulse">
              <DatabaseZap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neon-blue glow-text">
                DataVista
              </h2>
              <p className="text-xs text-gray-400">Analytics Suite</p>
            </div>
          </div>
          <SidebarTrigger className="text-neon-blue hover:text-neon-purple transition-colors" />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-neon-blue font-semibold mb-4 glow-text">
            Analytics Suite
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    className={`
                      group relative overflow-hidden rounded-lg p-3 transition-all duration-300 w-full min-h-[60px]
                      ${activeTab === item.id 
                        ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/50' 
                        : 'hover:bg-cyber-light/50 hover:border hover:border-neon-blue/30'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0
                        ${activeTab === item.id 
                          ? 'bg-gradient-to-br from-neon-blue to-neon-purple animate-glow-pulse' 
                          : 'bg-cyber-light group-hover:bg-gradient-to-br group-hover:from-neon-blue/50 group-hover:to-neon-purple/50'
                        }
                      `}>
                        <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm leading-tight ${activeTab === item.id ? 'text-neon-blue glow-text' : 'text-white'}`}>
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 leading-tight">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 rounded-lg animate-pulse" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-8 p-4 cyber-border rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-green to-neon-blue rounded-full mx-auto mb-3 animate-float flex items-center justify-center">
              <DatabaseZap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-neon-green font-semibold mb-1">AI-Powered</h3>
            <p className="text-xs text-gray-400">
              Real-time processing with advanced algorithms
            </p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
