import React, { useState } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Folder, File, FileText, Upload, MoreVertical, Trash2, ArrowLeft } from 'lucide-react';
import {
  useLibraryFolders,
  useLibraryItems,
  useCreateFolder,
  useDeleteFolder,
  useUploadFile,
  useDeleteItem,
  LibraryItemType
} from '@/features/library/hooks/use-library-queries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

export function LibraryExplorerPage() {
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string } | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const { data: folders = [], isLoading: loadingFolders } = useLibraryFolders(currentFolder?.id || null);
  const { data: items = [], isLoading: loadingItems } = useLibraryItems(currentFolder?.id || null);
  
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const deleteItem = useDeleteItem();
  const uploadFile = useUploadFile();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder.mutateAsync({ name: newFolderName, parentId: currentFolder?.id || null });
    setIsCreateFolderOpen(false);
    setNewFolderName('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile.mutateAsync({ file, folderId: currentFolder?.id || null });
  };

  const navigateUp = () => {
    // For simplicity in this demo, going up just goes to root. 
    // In a real app, you'd track the breadcrumb path or fetch the parent folder's details.
    setCurrentFolder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: 'Company' },
            { label: 'Content Library' },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateFolderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Folder
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" /> Upload File
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </Button>
          <Button onClick={() => navigate(`editor${currentFolder ? `?folderId=${currentFolder.id}` : ''}`)}>
            <FileText className="h-4 w-4 mr-2" /> Write Article
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 min-h-[500px]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          {currentFolder ? (
            <>
              <Button variant="ghost" size="icon" onClick={navigateUp}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">{currentFolder.name}</h2>
            </>
          ) : (
            <h2 className="text-xl font-semibold">Root Library</h2>
          )}
        </div>

        {(loadingFolders || loadingItems) ? (
          <p className="text-muted-foreground text-sm">Loading contents...</p>
        ) : folders.length === 0 && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Folder className="h-12 w-12 mb-4 opacity-20" />
            <p>This folder is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Render Folders */}
            {folders.map(folder => (
              <Card 
                key={folder.id} 
                className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setCurrentFolder({ id: folder.id, name: folder.name })}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Folder className="h-8 w-8 text-blue-400 shrink-0" fill="currentColor" />
                  <span className="font-medium truncate">{folder.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this folder and all its contents?')) {
                          deleteFolder.mutate(folder.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))}

            {/* Render Items */}
            {items.map(item => (
              <Card key={item.id} className="p-4 flex flex-col justify-between hover:bg-muted/50 group transition-colors relative">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.type !== LibraryItemType.FILE && (
                        <DropdownMenuItem onClick={() => navigate(`editor/${item.id}`)}>
                          Edit Article
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Delete this item?')) {
                            deleteItem.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div 
                  className="flex flex-col gap-2 cursor-pointer h-full"
                  onClick={() => {
                    if (item.type === LibraryItemType.FILE && item.fileUrl) {
                      window.open(item.fileUrl, '_blank');
                    } else {
                      navigate(`viewer/${item.id}`);
                    }
                  }}
                >
                  <div className="flex items-center justify-center h-20 bg-muted/30 rounded-md mb-2">
                    {item.type === LibraryItemType.FILE ? (
                      <File className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      <FileText className="h-10 w-10 text-km-forest" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2" title={item.title}>{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </p>
                    {item.isPinned && (
                      <span className="inline-block mt-1 text-[10px] bg-km-lime/20 text-km-forest px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                        Pinned
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Folder Name" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || createFolder.isPending}>
              {createFolder.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LibraryExplorerPage;
