import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';
import { Button } from './button';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  backPath?: string;
  backLabel?: string;
}

export function Breadcrumb({ items, backPath, backLabel = 'Back to Settings' }: BreadcrumbProps) {
  const { slug } = useParams();

  const resolvePath = (p?: string) => {
    if (!p) return undefined;
    if (p.startsWith('/')) return p;
    return slug ? `/t/${slug}/${p}` : p;
  };

  const defaultBack = resolvePath('settings');
  const targetBackPath = resolvePath(backPath) || defaultBack;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
      {/* Breadcrumb Trail */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to={slug ? `/t/${slug}/dashboard` : '/'}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          title="Dashboard"
        >
          <Home className="h-4 w-4" />
        </Link>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const href = resolvePath(item.path);

          return (
            <React.Fragment key={index}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              {isLast || !href ? (
                <span className="font-semibold text-foreground truncate">{item.label}</span>
              ) : (
                <Link to={href} className="hover:text-foreground transition-colors truncate">
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Quick Back Button */}
      {targetBackPath && (
        <Button variant="ghost" size="sm" asChild className="gap-2 text-xs font-medium">
          <Link to={targetBackPath}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
