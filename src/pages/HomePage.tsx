import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

export function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Your application is ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              This is the starting point. Ask Formance to build your app, and it
              will add pages, routes, and data here.
            </p>
            <Button onClick={() => window.alert("Add your first feature")}>
              Get started
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
