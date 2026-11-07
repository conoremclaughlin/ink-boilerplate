import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">My Project</h1>
        <Badge variant="secondary">Starter</Badge>
      </div>
      <p className="text-lg text-muted-foreground">
        Built with ink-boilerplate
      </p>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Components included</CardTitle>
          <CardDescription>
            shadcn/ui on Base UI with Tailwind v4. Add more with the shadcn CLI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="rounded-md bg-muted px-2 py-1 text-sm">
            npx shadcn@latest add &lt;component&gt;
          </code>
        </CardContent>
        <CardFooter className="gap-2">
          <Button>Get started</Button>
          <Button variant="outline">Read the docs</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
