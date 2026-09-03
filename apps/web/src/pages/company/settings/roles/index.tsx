import { useState, useEffect } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useEmployeesWithRoles,
  useAssignRole,
  useRevokeRole,
  useAllPermissions,
  useRolePermissions,
  useUpdateRolePermissions,
  type Role,
  type EmployeeWithRoles,
  type Permission,
} from '@/features/company/hooks/use-role-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Users,
  Lock,
  X,
  Check,
  Key,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Role colour map ──────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  'Company Admin': 'bg-violet-500/10 text-violet-600 border-violet-200',
  'HR Manager': 'bg-blue-500/10 text-blue-600 border-blue-200',
  Manager: 'bg-amber-500/10 text-amber-600 border-amber-200',
  Employee: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
};

function getRoleStyle(name: string) {
  return ROLE_COLORS[name] ?? 'bg-muted text-muted-foreground border-border';
}

// ─── Role Form Dialog ─────────────────────────────────────────────────────────

function RoleFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Role | null;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  useEffect(() => {
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
  }, [editing]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const action = editing
      ? updateMutation.mutateAsync({ id: editing.id, data: { name, description } })
      : createMutation.mutateAsync({ name, description });

    action
      .then(() => {
        toast.success(editing ? 'Role updated' : 'Role created');
        onOpenChange(false);
      })
      .catch((err: any) => {
        toast.error(err.response?.data?.error?.message || 'Something went wrong');
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the role name or description.'
              : 'Create a custom role for your organisation.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Department Head"
              disabled={editing?.isSystem}
            />
            {editing?.isSystem && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                System role names cannot be changed.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role's access..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Role Permissions Matrix Dialog ──────────────────────────────────────────

function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: Role | null;
}) {
  const { data: allPermissions, isLoading: loadingPerms } = useAllPermissions();
  const { data: rolePermIds, isLoading: loadingRolePerms } = useRolePermissions(role?.id ?? null);
  const updatePermissionsMutation = useUpdateRolePermissions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (rolePermIds) {
      setSelectedIds(new Set(rolePermIds));
    }
  }, [rolePermIds]);

  if (!role) return null;

  const isPending = updatePermissionsMutation.isPending;

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleGroup = (groupPerms: Permission[], selectAll: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      groupPerms.forEach((p) => {
        if (selectAll) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate(
      { roleId: role.id, permissionIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          toast.success(`Permissions updated for "${role.name}"`);
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || 'Failed to update permissions');
        },
      }
    );
  };

  // Group permissions by category
  const categories: Record<string, { label: string; icon: string; perms: Permission[] }> = {
    employee: { label: 'Employee Management', icon: '👥', perms: [] },
    org: { label: 'Organization & Structure', icon: '🏢', perms: [] },
    leave: { label: 'Leave & Approvals', icon: '📅', perms: [] },
    attendance: { label: 'Attendance & Shifts', icon: '⏱️', perms: [] },
    document: { label: 'Document Vault', icon: '📄', perms: [] },
    report: { label: 'Reports & Analytics', icon: '📊', perms: [] },
    settings: { label: 'Company Settings', icon: '⚙️', perms: [] },
    other: { label: 'General System', icon: '🔐', perms: [] },
  };

  allPermissions?.forEach((perm) => {
    const prefix = perm.action ? perm.action.split(':')[0] : 'other';
    const group = (prefix && categories[prefix]) ? categories[prefix] : categories['other'];
    if (group) {
      group.perms.push(perm);
    }
  });

  const isLoading = loadingPerms || loadingRolePerms;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Configure Permissions — {role.name}
          </DialogTitle>
          <DialogDescription>
            Select what actions users assigned to the <strong className="text-foreground">{role.name}</strong> role can perform in the system.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 my-2">
            {Object.entries(categories).map(([key, group]) => {
              if (group.perms.length === 0) return null;
              const allSelected = group.perms.every((p) => selectedIds.has(p.id));

              return (
                <div key={key} className="border rounded-lg p-4 space-y-3 bg-card">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <span>{group.icon}</span>
                      <span>{group.label}</span>
                      <Badge variant="secondary" className="text-[10px] ml-1">
                        {group.perms.filter((p) => selectedIds.has(p.id)).length} / {group.perms.length}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleToggleGroup(group.perms, !allSelected)}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {group.perms.map((perm) => {
                      const isChecked = selectedIds.has(perm.id);
                      return (
                        <label
                          key={perm.id}
                          htmlFor={`perm-${perm.id}`}
                          className={cn(
                            'flex items-start gap-3 p-2.5 rounded-md border text-xs cursor-pointer transition-colors hover:bg-accent/50',
                            isChecked ? 'border-primary/50 bg-primary/5' : 'border-border/50'
                          )}
                        >
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={isChecked}
                            onCheckedChange={() => handleToggle(perm.id)}
                            className="mt-0.5"
                          />
                          <div className="space-y-0.5">
                            <p className="font-mono font-medium text-foreground">{perm.action}</p>
                            <p className="text-muted-foreground">{perm.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            {selectedIds.size} total permission{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending || isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isPending ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab() {
  const { data: roles, isLoading } = useRoles();
  const deleteMutation = useDeleteRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [configuringPermRole, setConfiguringPermRole] = useState<Role | null>(null);

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleConfigurePermissions = (role: Role) => {
    setConfiguringPermRole(role);
    setPermDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (role.isSystem) {
      toast.error('System roles cannot be deleted.');
      return;
    }
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(role.id, {
      onSuccess: () => toast.success('Role deleted'),
      onError: (err: any) =>
        toast.error(err.response?.data?.error?.message || 'Delete failed'),
    });
  };

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Roles & Permissions' },
        ]}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Roles define what actions users can perform in the system. Configure permissions for any role to control access rights.
        </p>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setEditingRole(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Role
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles?.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border ${getRoleStyle(role.name)}`}
                    >
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{role.name}</p>
                        {role.isSystem && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4">
                            <Lock className="h-2.5 w-2.5 mr-1" />
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {role.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span>
                          <Users className="h-3 w-3 inline mr-1" />
                          {role._count?.userRoles ?? 0} member
                          {(role._count?.userRoles ?? 0) !== 1 ? 's' : ''}
                        </span>
                        <span>
                          <Key className="h-3 w-3 inline mr-1 text-primary" />
                          {role._count?.rolePermissions ?? 0} permission
                          {(role._count?.rolePermissions ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleConfigurePermissions(role)}
                      title="Configure Permissions"
                    >
                      <Key className="h-3.5 w-3.5 text-primary" />
                      Permissions
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleEdit(role)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!role.isSystem && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(role)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoleFormDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditingRole(null);
        }}
        editing={editingRole}
      />

      <RolePermissionsDialog
        open={permDialogOpen}
        onOpenChange={(v) => {
          setPermDialogOpen(v);
          if (!v) setConfiguringPermRole(null);
        }}
        role={configuringPermRole}
      />
    </div>
  );
}

// ─── Employee Role Assignment Card ────────────────────────────────────────────

function EmployeeRoleCard({ employee }: { employee: EmployeeWithRoles }) {
  const { data: roles } = useRoles();
  const assignMutation = useAssignRole();
  const revokeMutation = useRevokeRole();
  const [adding, setAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const userRoles = employee.user?.userRoles ?? [];
  const assignedRoleIds = new Set(userRoles.map((ur) => ur.roleId));
  const availableRoles = roles?.filter((r) => !assignedRoleIds.has(r.id)) ?? [];
  const initials = `${employee.firstName?.[0] || 'E'}${employee.lastName?.[0] || ''}`.toUpperCase();

  const handleAssign = () => {
    if (!selectedRole || !employee.user?.id) return;
    assignMutation.mutate(
      { userId: employee.user.id, roleId: selectedRole },
      {
        onSuccess: () => {
          toast.success('Role assigned');
          setAdding(false);
          setSelectedRole('');
        },
        onError: (err: any) =>
          toast.error(err.response?.data?.error?.message || 'Failed to assign role'),
      },
    );
  };

  const handleRevoke = (roleId: string, roleName: string) => {
    if (!employee.user?.id) return;
    revokeMutation.mutate(
      { userId: employee.user.id, roleId },
      {
        onSuccess: () => toast.success(`"${roleName}" removed`),
        onError: (err: any) =>
          toast.error(err.response?.data?.error?.message || 'Failed to revoke role'),
      },
    );
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm">
                {employee.firstName} {employee.lastName}
              </p>
              <span className="text-[10px] text-muted-foreground">{employee.user?.email ?? ''}</span>
            </div>

            {employee.designation && (
              <p className="text-xs text-muted-foreground mb-2">
                {employee.designation.name}
                {employee.department && ` · ${employee.department.name}`}
              </p>
            )}

            {/* Current roles */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {userRoles.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">No roles assigned</span>
              ) : (
                userRoles.map((ur) => (
                  <Badge
                    key={ur.roleId}
                    variant="outline"
                    className={`text-xs gap-1 pr-1 ${getRoleStyle(ur.role.name)}`}
                  >
                    {ur.role.name}
                    <button
                      onClick={() => handleRevoke(ur.roleId, ur.role.name)}
                      className="hover:text-destructive transition-colors ml-0.5"
                      title="Remove role"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {/* Add role */}
            {adding ? (
              <div className="flex items-center gap-2">
                <Select onValueChange={setSelectedRole} value={selectedRole}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                  onClick={handleAssign}
                  disabled={!selectedRole || assignMutation.isPending}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setAdding(false);
                    setSelectedRole('');
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : availableRoles.length > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs text-muted-foreground hover:text-foreground -ml-2"
                onClick={() => setAdding(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add role
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Assignments Tab ──────────────────────────────────────────────────────────

function AssignmentsTab() {
  const { data: employees, isLoading } = useEmployeesWithRoles();
  const [search, setSearch] = useState('');

  const filtered = employees?.filter((e) => {
    const q = search.toLowerCase();
    const email = e.user?.email ?? '';
    return (
      !q ||
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Assign one or more roles to each employee. Click <strong>×</strong> on a badge to revoke.
        </p>
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-56 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 mb-3 text-muted-foreground/30" />
          <p className="font-semibold">No employees found</p>
          <p className="text-sm text-muted-foreground">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((emp) => (
            <EmployeeRoleCard key={emp.id} employee={emp} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ActiveTab = 'roles' | 'assignments';

export function RolesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('roles');

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Roles & Permissions
        </h2>
        <p className="text-muted-foreground mt-1">
          Define roles, configure module access permissions, and assign roles to your employees.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(
          [
            { key: 'roles', label: 'Manage Roles & Permissions', icon: Shield },
            { key: 'assignments', label: 'Employee Role Assignments', icon: UserCheck },
          ] as { key: ActiveTab; label: string; icon: any }[]
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'roles' ? <RolesTab /> : <AssignmentsTab />}
    </div>
  );
}
