import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Camera, Search, Package, AlertCircle, CheckCircle } from 'lucide-react';

interface BarcodeProduct {
    barcode: string;
    product_name: string;
    brand: string | null;
    nutrition_data: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        serving_size?: string;
    };
    image_url: string | null;
    verified: boolean;
}

export default function BarcodeScanner() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [scanning, setScanning] = useState(false);
    const [manualBarcode, setManualBarcode] = useState('');
    const [searching, setSearching] = useState(false);
    const [product, setProduct] = useState<BarcodeProduct | null>(null);
    const [recentScans, setRecentScans] = useState<BarcodeProduct[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        checkAuth();
        loadRecentScans();

        return () => {
            stopCamera();
        };
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
        }
    };

    const loadRecentScans = async () => {
        try {
            const { data, error } = await supabase
                .from('barcode_cache')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setRecentScans(data || []);
        } catch (error) {
            console.error('Error loading recent scans:', error);
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            setStream(mediaStream);
            setScanning(true);

            toast({
                title: 'Camera started',
                description: 'Position barcode in the center of the frame'
            });
        } catch (error) {
            console.error('Error starting camera:', error);
            toast({
                title: 'Camera error',
                description: 'Unable to access camera. Please check permissions.',
                variant: 'destructive'
            });
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setScanning(false);
    };

    const searchBarcode = async (barcode: string) => {
        if (!barcode.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a barcode',
                variant: 'destructive'
            });
            return;
        }

        setSearching(true);
        setProduct(null);

        try {
            // First, check our cache
            const { data: cachedProduct } = await supabase
                .from('barcode_cache')
                .select('*')
                .eq('barcode', barcode)
                .single();

            if (cachedProduct) {
                setProduct(cachedProduct);
                toast({
                    title: 'Product found!',
                    description: 'Loaded from cache'
                });
                return;
            }

            // If not in cache, fetch from Open Food Facts API
            const response = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
            );

            if (!response.ok) {
                throw new Error('Product not found');
            }

            const data = await response.json();

            if (data.status === 0) {
                toast({
                    title: 'Product not found',
                    description: 'This barcode is not in our database',
                    variant: 'destructive'
                });
                return;
            }

            const productData = data.product;
            const nutritionData = {
                calories: Math.round(productData.nutriments?.['energy-kcal_100g'] || 0),
                protein: Math.round(productData.nutriments?.proteins_100g || 0),
                carbs: Math.round(productData.nutriments?.carbohydrates_100g || 0),
                fat: Math.round(productData.nutriments?.fat_100g || 0),
                serving_size: productData.serving_size || '100g'
            };

            const newProduct: BarcodeProduct = {
                barcode: barcode,
                product_name: productData.product_name || 'Unknown Product',
                brand: productData.brands || null,
                nutrition_data: nutritionData,
                image_url: productData.image_url || null,
                verified: false
            };

            // Save to cache
            await supabase.from('barcode_cache').insert({
                barcode: newProduct.barcode,
                product_name: newProduct.product_name,
                brand: newProduct.brand,
                nutrition_data: newProduct.nutrition_data,
                image_url: newProduct.image_url,
                verified: false,
                source: 'openfoodfacts'
            });

            setProduct(newProduct);
            loadRecentScans();

            toast({
                title: 'Product found!',
                description: productData.product_name
            });
        } catch (error) {
            console.error('Error searching barcode:', error);
            toast({
                title: 'Error',
                description: 'Failed to find product. Try manual entry.',
                variant: 'destructive'
            });
        } finally {
            setSearching(false);
        }
    };

    const logProduct = async (productData: BarcodeProduct) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Create meal entry
            const { error } = await supabase
                .from('meal_entries')
                .insert({
                    user_id: user.id,
                    meal_slot: 'snack', // Default to snack, user can change
                    total_calories: productData.nutrition_data.calories,
                    total_protein: productData.nutrition_data.protein,
                    total_carbs: productData.nutrition_data.carbs,
                    total_fat: productData.nutrition_data.fat,
                    analyzer_json: {
                        food: [{
                            name: productData.product_name,
                            quantity: productData.nutrition_data.serving_size || '100g',
                            calories: productData.nutrition_data.calories,
                            protein: productData.nutrition_data.protein,
                            carbs: productData.nutrition_data.carbs,
                            fat: productData.nutrition_data.fat
                        }],
                        total: {
                            calories: productData.nutrition_data.calories,
                            protein: productData.nutrition_data.protein,
                            carbs: productData.nutrition_data.carbs,
                            fat: productData.nutrition_data.fat
                        }
                    }
                });

            if (error) throw error;

            // Award points
            await supabase.from('points_history').insert({
                user_id: user.id,
                points: 10,
                reason: 'Logged meal via barcode scanner'
            });

            toast({
                title: 'Meal logged!',
                description: `${productData.product_name} added to your log (+10 points)`
            });

            setProduct(null);
            setManualBarcode('');
        } catch (error) {
            console.error('Error logging product:', error);
            toast({
                title: 'Error',
                description: 'Failed to log meal',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">📷 Barcode Scanner</h1>
                <p className="text-muted-foreground">Scan packaged food barcodes for instant nutrition data</p>
            </div>

            {/* Scanner Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Scan Barcode</CardTitle>
                    <CardDescription>
                        Use your camera to scan or enter barcode manually
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!scanning ? (
                        <div className="space-y-4">
                            <Button onClick={startCamera} className="w-full" size="lg">
                                <Camera className="w-5 h-5 mr-2" />
                                Start Camera Scanner
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter barcode manually"
                                    value={manualBarcode}
                                    onChange={(e) => setManualBarcode(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchBarcode(manualBarcode)}
                                />
                                <Button
                                    onClick={() => searchBarcode(manualBarcode)}
                                    disabled={searching}
                                >
                                    <Search className="w-4 h-4 mr-2" />
                                    {searching ? 'Searching...' : 'Search'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-32 border-4 border-primary rounded-lg"></div>
                                </div>
                            </div>
                            <Button onClick={stopCamera} variant="outline" className="w-full">
                                Stop Camera
                            </Button>
                            <p className="text-sm text-muted-foreground text-center">
                                Note: Automatic barcode detection requires additional library.
                                Use manual entry for now.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Product Result */}
            {product && (
                <Card className="mb-6 border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Product Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            {product.image_url && (
                                <img
                                    src={product.image_url}
                                    alt={product.product_name}
                                    className="w-24 h-24 object-cover rounded-lg"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{product.product_name}</h3>
                                {product.brand && (
                                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Barcode: {product.barcode}
                                </p>
                            </div>
                        </div>

                        {/* Nutrition Info */}
                        <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-muted rounded-lg">
                            <div className="text-center">
                                <div className="text-xl font-bold">{product.nutrition_data.calories}</div>
                                <div className="text-xs text-muted-foreground">Calories</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-blue-600">{product.nutrition_data.protein}g</div>
                                <div className="text-xs text-muted-foreground">Protein</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-green-600">{product.nutrition_data.carbs}g</div>
                                <div className="text-xs text-muted-foreground">Carbs</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-amber-600">{product.nutrition_data.fat}g</div>
                                <div className="text-xs text-muted-foreground">Fat</div>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                            Per {product.nutrition_data.serving_size || '100g'}
                        </p>

                        <Button onClick={() => logProduct(product)} className="w-full mt-4">
                            Log This Product
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Recent Scans */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Recent Scans
                    </CardTitle>
                    <CardDescription>Previously scanned products</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentScans.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No recent scans</p>
                            <p className="text-sm">Scan a barcode to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentScans.map((scan) => (
                                <div
                                    key={scan.barcode}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                                    onClick={() => setProduct(scan)}
                                >
                                    <div className="flex items-center gap-3">
                                        {scan.image_url && (
                                            <img
                                                src={scan.image_url}
                                                alt={scan.product_name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        )}
                                        <div>
                                            <p className="font-semibold">{scan.product_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {scan.nutrition_data.calories} cal • {scan.barcode}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            logProduct(scan);
                                        }}
                                    >
                                        Log
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                            <p className="font-semibold mb-1">How it works:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                                <li>Scan or enter barcode from packaged food</li>
                                <li>Nutrition data fetched from Open Food Facts database</li>
                                <li>Review and log the product to your diary</li>
                                <li>Previously scanned items are cached for quick access</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
