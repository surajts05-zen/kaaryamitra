import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronUp, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Employee = any;

const OrgNodeCard = ({ 
  employee, 
  isFocused = false,
  onFocus
}: { 
  employee: Employee; 
  isFocused?: boolean;
  onFocus?: () => void;
}) => {
  const navigate = useNavigate();
  const initials = employee.firstName && employee.lastName 
    ? `${employee.firstName[0]}${employee.lastName[0]}`
    : 'U';

  return (
    <Card 
      onClick={() => navigate(employee.id)}
      className={`w-56 p-4 flex flex-col items-center justify-center text-center relative z-10 transition-all cursor-pointer hover:border-primary/50 hover:shadow-md ${
        isFocused ? 'border-primary shadow-md ring-1 ring-primary/20 bg-primary/5' : 'bg-card shadow-sm'
      }`}
      title="View Profile"
    >
      <Avatar className={`h-12 w-12 mb-2 ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee.firstName} />}
        <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
      </Avatar>
      <div className="font-semibold text-sm truncate w-full px-2">
        {employee.firstName} {employee.lastName}
      </div>
      <div className="text-xs text-muted-foreground mt-1 truncate w-full px-2">
        {employee.designation?.name || 'Employee'}
      </div>
      
      {onFocus && (
        <Button 
          variant="secondary" 
          size="icon" 
          className="absolute -bottom-3 h-6 w-6 rounded-full border shadow-sm z-20"
          onClick={(e) => {
            e.stopPropagation();
            onFocus();
          }}
          title="Center in Org Chart"
        >
          <Network className="h-3 w-3" />
        </Button>
      )}
    </Card>
  );
};

export function OrgChartView({ employees }: { employees: Employee[] }) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Initialize focusedId to the CEO (employee with no manager) or first employee
  useEffect(() => {
    if (employees.length > 0 && !focusedId) {
      const root = employees.find(e => !e.managerId) || employees[0];
      setFocusedId(root.id);
    }
  }, [employees, focusedId]);

  if (!employees.length) {
    return (
      <div className="text-center p-8 text-muted-foreground h-64 flex items-center justify-center border rounded-lg">
        No employees found to build the organizational chart.
      </div>
    );
  }

  const focusedEmployee = employees.find(e => e.id === focusedId) || employees[0];
  const manager = focusedEmployee?.managerId ? employees.find(e => e.id === focusedEmployee.managerId) : null;
  const directReports = employees.filter(e => e.managerId === focusedEmployee.id);

  return (
    <div className="p-8 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 overflow-auto min-h-[600px]">
      <div className="flex flex-col items-center py-10 w-max min-w-full mx-auto">
        
        {/* Manager Level (1 Level Above) */}
        {manager && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OrgNodeCard 
              employee={manager} 
              onFocus={() => setFocusedId(manager.id)} 
            />
            <div className="w-px h-10 bg-border relative">
               <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-background border rounded-full p-0.5 cursor-pointer hover:bg-muted text-muted-foreground" onClick={() => setFocusedId(manager.id)} title="Go up to manager">
                 <ChevronUp className="w-3 h-3" />
               </div>
            </div>
          </div>
        )}

        {/* Focused Employee Level */}
        <div className="flex flex-col items-center relative z-20 animate-in zoom-in-95 duration-300">
          <OrgNodeCard employee={focusedEmployee} isFocused />
        </div>

        {/* Direct Reports Level (1 Level Below) */}
        {directReports.length > 0 && (
          <div className="relative mt-0 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500 w-full">
            {/* Vertical line down from focused employee */}
            <div className="h-10 w-px bg-border"></div>
            
            <div className="relative flex justify-center w-full min-w-max">
              {/* Horizontal line connecting children if > 1 */}
              {directReports.length > 1 && (
                <div className="absolute top-0 h-px bg-border" style={{ 
                  left: `calc(50% - ${(directReports.length - 1) * 140}px)`, 
                  width: `${(directReports.length - 1) * 280}px`
                }}></div>
              )}
              
              {/* Using a flex container for children */}
              <div className="flex gap-14 relative justify-center px-4">
                {directReports.map((report, idx) => (
                  <div key={report.id} className="relative flex flex-col items-center w-56 shrink-0">
                    {/* Vertical line up to horizontal connector */}
                    {directReports.length > 1 && (
                      <div className="absolute top-0 left-1/2 w-px h-6 bg-border -translate-x-1/2 -mt-6"></div>
                    )}
                    {directReports.length === 1 && (
                      <div className="absolute top-0 left-1/2 w-px h-0 bg-border -translate-x-1/2"></div>
                    )}
                    <OrgNodeCard 
                      employee={report} 
                      onFocus={() => setFocusedId(report.id)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
