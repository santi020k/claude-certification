import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            @repo/ui · shadcn/ui
          </h1>
          <p className="text-muted-foreground text-lg">
            Shared component library for the certification monorepo.
          </p>
        </div>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </section>

        {/* Form Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Form</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" placeholder="Your name" />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Cards</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Add more components to <code className="text-xs">packages/ui</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Run <code className="text-xs font-medium">pnpm shadcn add &lt;component&gt;</code> from inside{" "}
                  <code className="text-xs">packages/ui</code>.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="w-full">Learn more</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
                <CardDescription>FastAPI backend running on port 8000.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="secondary">Python</Badge>
                  <Badge variant="secondary">FastAPI</Badge>
                  <Badge variant="outline">Anthropic</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline" className="w-full">View docs</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monorepo</CardTitle>
                <CardDescription>Powered by Turborepo + pnpm workspaces.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge>Turbo</Badge>
                  <Badge variant="secondary">pnpm</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="ghost" className="w-full">Explore</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
}
