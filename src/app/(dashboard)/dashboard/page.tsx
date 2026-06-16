import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequiredUser } from "@/lib/auth/helpers";

export default async function DashboardPage() {
  const user = await getRequiredUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Mirë se erdhët në panelin tuaj.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
          <CardDescription>Llogaria juaj</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
