import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Employee = any; // Adjust type based on actual schema
type TreeNode = Employee & { children: TreeNode[] };

function buildTree(employees: Employee[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Initialize map
  employees.forEach((emp) => {
    map.set(emp.id, { ...emp, children: [] });
  });

  // Build tree
  employees.forEach((emp) => {
    const node = map.get(emp.id)!;
    if (emp.managerId && map.has(emp.managerId)) {
      map.get(emp.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

const OrgChartNode = ({ node }: { node: TreeNode }) => {
  const initials = `${node.firstName[0]}${node.lastName[0]}`;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <Card className="w-56 p-4 flex flex-col items-center justify-center text-center shadow-sm relative z-10 bg-card">
        <Avatar className="h-12 w-12 mb-2">
          {node.avatarUrl && <AvatarImage src={node.avatarUrl} alt={node.firstName} />}
          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="font-semibold text-sm">
          {node.firstName} {node.lastName}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {node.designation?.name || 'Employee'}
        </div>
      </Card>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="relative mt-8 flex justify-center pt-4">
          {/* Vertical line from parent to horizontal connector */}
          <div className="absolute top-0 left-1/2 -mt-8 h-8 w-px bg-border -translate-x-1/2"></div>
          
          {/* Horizontal connector line for children if there is more than 1 child */}
          {node.children.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-px bg-border"></div>
          )}

          <div className="flex gap-8">
            {node.children.map((child: TreeNode, _index: number) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Vertical line to child */}
                <div className="absolute top-0 left-1/2 -mt-4 h-4 w-px bg-border -translate-x-1/2"></div>
                <OrgChartNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function OrgChartView({ employees }: { employees: Employee[] }) {
  const roots = useMemo(() => buildTree(employees), [employees]);

  if (!employees.length) {
    return (
      <div className="text-center p-8 text-muted-foreground h-64 flex items-center justify-center border rounded-lg">
        No employees found to build the organizational chart.
      </div>
    );
  }

  return (
    <div className="p-8 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto min-h-[600px] flex justify-center items-start">
      <div className="flex gap-16">
        {roots.map((root) => (
          <OrgChartNode key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}
