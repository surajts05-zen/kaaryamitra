import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';

export function UiDemoPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="text-muted-foreground mt-2">
          KaaryaMitra Phase 1 — Core UI components and branding verification.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Primary interactions and states.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col items-start">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="gradient" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Gradient CTA
            </Button>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators and tags.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Failed</Badge>
            <Badge variant="success">Active</Badge>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Inputs and labels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="m@example.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="search" placeholder="Search..." className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Glass Card */}
        <Card className="glass lg:col-span-3">
          <CardHeader>
            <CardTitle>Glassmorphism Effect</CardTitle>
            <CardDescription>Used for overlays, widgets, and modern accents.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              The KaaryaMitra design system uses subtle glass effects (`bg-card/80 backdrop-blur-md`) to create depth without clutter.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Action</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
