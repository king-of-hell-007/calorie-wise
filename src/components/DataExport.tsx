import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV } from '@/lib/exportData';
import { useToast } from '@/hooks/use-toast';

export const DataExport = () => {
    const [exporting, setExporting] = useState(false);
    const { toast } = useToast();

    const handleExport = async () => {
        setExporting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: 'Error',
                    description: 'You must be logged in to export data',
                    variant: 'destructive',
                });
                return;
            }

            const { data: meals, error } = await supabase
                .from('meal_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!meals || meals.length === 0) {
                toast({
                    title: 'No Data',
                    description: 'You don\'t have any meals to export yet',
                });
                return;
            }

            exportToCSV(meals, `caloriewise-export-${new Date().toISOString().split('T')[0]}.csv`);

            toast({
                title: 'Export Successful',
                description: `Exported ${meals.length} meals to CSV`,
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export Failed',
                description: 'Failed to export data. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setExporting(false);
        }
    };

    return (
        <Card className="shadow-strong">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    Export Data
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Download all your meal data as a CSV file for backup or analysis in other tools.
                </p>
                <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full"
                >
                    {exporting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            Export to CSV
                        </>
                    )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    Unlocked at 60-day streak ⚡
                </p>
            </CardContent>
        </Card>
    );
};
