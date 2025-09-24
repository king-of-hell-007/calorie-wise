import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { NutritionResults } from '@/components/NutritionResults';
import { Sparkles, Smartphone, Zap } from 'lucide-react';
import heroImage from '@/assets/hero-nutrition.jpg';

interface NutritionData {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  confidence: number;
  foods: string[];
}

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);

  const simulateNutritionAnalysis = async (imageFile: File): Promise<NutritionData> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock nutrition data - replace with actual API call
    return {
      protein: Math.floor(Math.random() * 30) + 15,
      carbs: Math.floor(Math.random() * 40) + 20,
      fat: Math.floor(Math.random() * 20) + 10,
      calories: Math.floor(Math.random() * 400) + 300,
      confidence: 0.85 + Math.random() * 0.1,
      foods: ['Chicken breast', 'Rice', 'Broccoli', 'Olive oil']
    };
  };

  const handleAnalyze = async (imageFile: File) => {
    setIsAnalyzing(true);
    try {
      // Replace this with actual API call
      // const formData = new FormData();
      // formData.append('image', imageFile);
      // const response = await fetch('/api/analyze-nutrition', {
      //   method: 'POST',
      //   body: formData
      // });
      // const data = await response.json();
      
      const data = await simulateNutritionAnalysis(imageFile);
      setNutritionData(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setNutritionData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">CalorieWise</h1>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        {!nutritionData && (
          <section className="py-12 lg:py-20">
            <div className="max-w-4xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                      Instant Nutrition
                      <span className="bg-gradient-primary bg-clip-text text-transparent"> Analysis</span>
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Simply snap a photo of your meal and get detailed macronutrient breakdown in seconds. 
                      Track protein, carbs, fat, and calories with AI-powered precision.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Smartphone className="w-4 h-4 text-primary" />
                      <span>Mobile-first design</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>Instant results</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>AI-powered accuracy</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <img
                    src={heroImage}
                    alt="Fresh healthy meal with nutrition analysis"
                    className="w-full rounded-2xl shadow-strong"
                  />
                  <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-2xl"></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Upload Section */}
        <section className="py-8 lg:py-12">
          <div className="max-w-2xl mx-auto">
            {nutritionData ? (
              <NutritionResults data={nutritionData} onReset={handleReset} />
            ) : (
              <div className="space-y-6">
                {!isAnalyzing && (
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground">
                      Analyze Your Meal
                    </h2>
                    <p className="text-muted-foreground">
                      Upload a photo or take a picture to get started
                    </p>
                  </div>
                )}
                <ImageUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        {!nutritionData && !isAnalyzing && (
          <section className="py-12 lg:py-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-3xl font-bold text-foreground">
                  How It Works
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our advanced AI technology analyzes your food photos to provide 
                  accurate nutritional information instantly.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: '1',
                    title: 'Capture or Upload',
                    description: 'Take a photo of your meal or upload an existing image from your gallery.',
                    icon: Smartphone
                  },
                  {
                    step: '2',
                    title: 'AI Analysis',
                    description: 'Our AI identifies ingredients and calculates nutritional values in seconds.',
                    icon: Sparkles
                  },
                  {
                    step: '3',
                    title: 'Get Results',
                    description: 'Receive detailed macro breakdown: protein, carbs, fat, and total calories.',
                    icon: Zap
                  }
                ].map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.step} className="p-6 text-center space-y-4 shadow-soft hover:shadow-medium transition-smooth">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">CalorieWise</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Making nutrition tracking simple and accessible for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;