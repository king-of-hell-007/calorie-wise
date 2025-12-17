import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Key, Trash2, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface ApiKey {
  id: string;
  key_name: string;
  provider: string;
  is_active: boolean;
  usage_count: number;
  error_count: number;
  last_used_at: string | null;
  last_error_at: string | null;
  created_at: string;
}

const Admin = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    }
  };

  const addApiKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast.error('Please enter both key name and value');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('admin_api_keys')
        .insert({
          key_name: newKeyName.trim(),
          key_value: newKeyValue.trim(),
          provider: 'gemini',
          is_active: true
        });

      if (error) throw error;

      toast.success('API key added successfully');
      setNewKeyName('');
      setNewKeyValue('');
      fetchApiKeys();
    } catch (error: any) {
      console.error('Error adding API key:', error);
      toast.error('Failed to add API key');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) throw error;

      toast.success(`API key ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchApiKeys();
    } catch (error: any) {
      console.error('Error toggling key status:', error);
      toast.error('Failed to update key status');
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const { error } = await supabase
        .from('admin_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast.success('API key deleted');
      fetchApiKeys();
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage Gemini API keys for nutrition analysis</p>
          </div>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        {/* Add New Key Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New API Key
            </CardTitle>
            <CardDescription>
              Add a Gemini 2.5 Flash API key for automatic rotation and failover
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Key Name</label>
                <Input
                  placeholder="e.g., Gemini Key 1"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">API Key Value</label>
                <Input
                  type="password"
                  placeholder="AIza..."
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={addApiKey} disabled={isLoading} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </CardContent>
        </Card>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Active API Keys ({apiKeys.length}/3 recommended)
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchApiKeys}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              The system automatically rotates between keys based on usage and error counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No API keys configured. Add at least one key to start analyzing nutrition.
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`border rounded-lg p-4 ${
                      key.is_active ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Key className={`h-5 w-5 ${key.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <h3 className="font-semibold">{key.key_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {key.provider} • Added {new Date(key.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={key.is_active ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleKeyStatus(key.id, key.is_active)}
                        >
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteApiKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Usage Count</p>
                        <p className="font-semibold">{key.usage_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Error Count</p>
                        <p className="font-semibold text-destructive">{key.error_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Used</p>
                        <p className="font-semibold">
                          {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Error</p>
                        <p className="font-semibold">
                          {key.last_error_at ? new Date(key.last_error_at).toLocaleString() : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">How Key Rotation Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Keys are automatically selected based on lowest error count and usage count</p>
            <p>• If a key fails, the system immediately tries the next available key</p>
            <p>• Error counts are tracked to identify problematic keys</p>
            <p>• Recommended: Keep 3 active keys for optimal failover</p>
            <p>• You can manually activate/deactivate keys as needed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
