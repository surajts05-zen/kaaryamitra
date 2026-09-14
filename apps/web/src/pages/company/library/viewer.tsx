import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useLibraryItems } from '@/features/library/hooks/use-library-queries';
import { format } from 'date-fns';
import { Edit, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function LibraryViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: items, isLoading } = useLibraryItems(null);

  const item = items?.find((i) => i.id === id);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Content Library', path: `${window.location.pathname.match(/^(\/t\/[^/]+)/)?.[1] || ''}/library` },
            { label: 'Not Found' },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>Article not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => {
            const match = window.location.pathname.match(/^(\/t\/[^/]+)/);
            navigate(`${match ? match[1] : ''}/company/library`);
          }}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-20">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: 'Content Library', path: `${window.location.pathname.match(/^(\/t\/[^/]+)/)?.[1] || ''}/library` },
            { label: item.title },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const match = window.location.pathname.match(/^(\/t\/[^/]+)/);
            navigate(`${match ? match[1] : ''}/library`);
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={() => {
            const match = window.location.pathname.match(/^(\/t\/[^/]+)/);
            navigate(`${match ? match[1] : ''}/library/editor/${item.id}`);
          }}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      <Card className="p-8">
        <div className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{format(new Date(item.createdAt), 'MMMM d, yyyy')}</span>
            {item.isPinned && (
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">
                Pinned Announcement
              </span>
            )}
            {item.isArchived && (
              <span className="bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                Archived
              </span>
            )}
          </div>
        </div>

        <div 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: item.content || '' }}
        />
      </Card>
    </div>
  );
}

export default LibraryViewerPage;
