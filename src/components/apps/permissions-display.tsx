import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
import { BTCPayPermission } from '@/types/plugin';

interface PermissionsDisplayProps {
  permissions: BTCPayPermission[];
  className?: string;
}

export function PermissionsDisplay({ permissions, className }: PermissionsDisplayProps) {
  const requiredPermissions = permissions.filter(p => p.required);
  const optionalPermissions = permissions.filter(p => !p.required);
  
  if (permissions.length === 0) {
    return null;
  }
  
  return (
    <div className={className}>
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <p className="font-medium">API Key Permissions Required</p>
            
            {requiredPermissions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Required permissions:</p>
                <ul className="space-y-1">
                  {requiredPermissions.map((perm) => (
                    <li key={perm.permission} className="flex items-start gap-2">
                      <Badge variant="default" className="text-xs">
                        {perm.permission}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {perm.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {optionalPermissions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Optional permissions:</p>
                <ul className="space-y-1">
                  {optionalPermissions.map((perm) => (
                    <li key={perm.permission} className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        {perm.permission}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {perm.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              Configure your API key in Settings with these permissions enabled.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}