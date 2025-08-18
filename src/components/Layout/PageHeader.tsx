import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  stats?: {
    label: string;
    value: string;
    trend?: {
      value: string;
      isPositive: boolean;
    };
    icon: LucideIcon;
    color?: string;
  }[];
  primaryAction?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
  secondaryActions?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  stats, 
  primaryAction, 
  secondaryActions 
}: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Main Header */}
      <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-2xl border-0 overflow-hidden relative group">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full translate-y-40 -translate-x-40 group-hover:scale-110 transition-transform duration-1000 delay-200"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32 group-hover:scale-125 transition-transform duration-1000 delay-500"></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-1000 delay-300"></div>
          <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-1000 delay-400"></div>
        </div>
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white font-inter drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-300">
                    {title}
                  </h1>
                  <p className="text-base md:text-xl font-medium drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300">
                    {description}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {secondaryActions}
              {primaryAction && (
                <Button 
                  onClick={primaryAction.onClick}
                  size="lg" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg backdrop-blur-sm flex-1 lg:flex-none transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  variant="outline"
                >
                  <primaryAction.icon className="h-5 w-5 mr-2" />
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Section */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            // Define color schemes for each stat card
            const colorSchemes = [
              {
                bg: 'from-blue-500 via-blue-600 to-blue-700',
                iconBg: 'from-blue-400 to-blue-500',
                text: 'text-blue-700',
                border: 'border-blue-200',
                shadow: 'shadow-blue-200/50'
              },
              {
                bg: 'from-emerald-500 via-emerald-600 to-emerald-700',
                iconBg: 'from-emerald-400 to-emerald-500',
                text: 'text-emerald-700',
                border: 'border-emerald-200',
                shadow: 'shadow-emerald-200/50'
              },
              {
                bg: 'from-purple-500 via-purple-600 to-purple-700',
                iconBg: 'from-purple-400 to-purple-500',
                text: 'text-purple-700',
                border: 'border-purple-200',
                shadow: 'shadow-purple-200/50'
              },
              {
                bg: 'from-orange-500 via-orange-600 to-orange-700',
                iconBg: 'from-orange-400 to-orange-500',
                text: 'text-orange-700',
                border: 'border-orange-200',
                shadow: 'shadow-orange-200/50'
              },
              {
                bg: 'from-pink-500 via-pink-600 to-pink-700',
                iconBg: 'from-pink-400 to-pink-500',
                text: 'text-pink-700',
                border: 'border-pink-200',
                shadow: 'shadow-pink-200/50'
              },
              {
                bg: 'from-cyan-500 via-cyan-600 to-cyan-700',
                iconBg: 'from-cyan-400 to-cyan-500',
                text: 'text-cyan-700',
                border: 'border-cyan-200',
                shadow: 'shadow-cyan-200/50'
              }
            ];
            
            const scheme = colorSchemes[index % colorSchemes.length];
            
            return (
              <Card 
                key={index} 
                className={`bg-gradient-to-br ${scheme.bg} shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 overflow-hidden group cursor-pointer`}
              >
                <div className="p-6 relative">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full translate-y-12 -translate-x-12 group-hover:scale-150 transition-transform duration-700 delay-100"></div>
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white/10 rounded-full -translate-x-8 -translate-y-8 group-hover:scale-200 transition-transform duration-700 delay-200"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-2">
                        <p className="text-base text-white/80 font-medium tracking-wide">
                          {stat.label}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                            {stat.value}
                          </p>
                          {stat.trend && (
                            <Badge 
                              variant="secondary"
                              className={`text-sm font-medium px-3 py-2 ${
                                stat.trend.isPositive 
                                  ? 'bg-green-500/20 text-green-100 border-green-300/30' 
                                  : 'bg-red-500/20 text-red-100 border-red-300/30'
                              }`}
                            >
                              {stat.trend.isPositive ? '↗' : '↘'} {stat.trend.value}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className={`p-5 rounded-2xl bg-gradient-to-br ${scheme.iconBg} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/20`}>
                        <stat.icon className="h-7 w-7 md:h-8 md:w-8 text-white drop-shadow-md" />
                      </div>
                    </div>
                    
                    {/* Hover effect line */}
                    <div className="absolute bottom-0 left-0 w-0 h-1 bg-white/40 group-hover:w-full transition-all duration-700 ease-out rounded-full"></div>
                    
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}