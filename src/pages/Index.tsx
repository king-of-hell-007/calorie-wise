import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { NutritionResults } from '@/components/NutritionResults';
import { Sparkles, Smartphone, Zap, Camera } from 'lucide-react';
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
    <div className="min-h-screen bg-sectionPrimary">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-cta rounded-xl flex items-center justify-center shadow-medium">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">CalorieWise</h1>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex font-semibold hover:bg-primary hover:text-primary-foreground transition-smooth">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Compact Hero Section with Prominent CTA */}
        {!nutritionData && (
          <section className="bg-gradient-hero py-16 lg:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h1 className="text-5xl lg:text-6xl font-black text-foreground leading-tight">
                        Instant 
                        <span className="bg-gradient-primary bg-clip-text text-transparent block"> Nutrition</span>
                        <span className="text-foreground">Analysis</span>
                      </h1>
                      <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                        Snap a photo, get detailed macros in seconds. AI-powered precision for smarter nutrition tracking.
                      </p>
                    </div>
                    
                    {/* Big Bold CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        className="bg-gradient-cta hover:shadow-glow text-white font-bold text-lg px-8 py-4 h-auto rounded-xl transition-all duration-300 hover:scale-105 shadow-strong"
                        onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        <Camera className="w-6 h-6 mr-3" />
                        Start Analyzing Now
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="font-semibold text-lg px-8 py-4 h-auto rounded-xl border-2 hover:bg-primary hover:text-primary-foreground transition-smooth"
                        onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        How It Works
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4">
                      <div className="flex items-center space-x-3 text-base font-medium">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-foreground">Mobile-first</span>
                      </div>
                      <div className="flex items-center space-x-3 text-base font-medium">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-foreground">Instant results</span>
                      </div>
                      <div className="flex items-center space-x-3 text-base font-medium">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-foreground">AI-powered</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="relative rounded-3xl overflow-hidden shadow-strong">
                      <img
                        src={heroImage}
                        alt="Fresh healthy meal with nutrition analysis"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
                    </div>
                    {/* Floating nutrition preview */}
                    <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-strong border border-border">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">524</div>
                        <div className="text-sm text-muted-foreground">calories</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Upload Section */}
        <section id="upload-section" className="py-12 lg:py-16 bg-sectionSecondary">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {nutritionData ? (
                <NutritionResults data={nutritionData} onReset={handleReset} />
              ) : (
                <div className="space-y-8">
                  {!isAnalyzing && (
                    <div className="text-center space-y-4">
                      <h2 className="text-4xl font-bold text-foreground">
                        Ready to Analyze?
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        Upload a photo or capture your meal to get instant nutrition insights
                      </p>
                    </div>
                  )}
                  <ImageUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features - How It Works */}
        {!nutritionData && !isAnalyzing && (
          <section id="how-it-works" className="py-16 lg:py-24 bg-sectionPrimary">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center space-y-6 mb-16">
                  <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                    How It <span className="bg-gradient-primary bg-clip-text text-transparent">Works</span>
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Our advanced AI analyzes your food photos to deliver precise nutritional breakdowns in seconds
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      step: '01',
                      title: 'Capture or Upload',
                      description: 'Take a photo of your meal or upload from your gallery. Works with any device, anywhere.',
                      icon: Smartphone,
                      color: 'from-blue-500 to-cyan-500'
                    },
                    {
                      step: '02',
                      title: 'AI Analysis',
                      description: 'Our powerful AI identifies ingredients and calculates precise nutritional values instantly.',
                      icon: Sparkles,
                      color: 'from-purple-500 to-pink-500'
                    },
                    {
                      step: '03',
                      title: 'Get Results',
                      description: 'Receive detailed macro breakdown with protein, carbs, fat, and total calorie information.',
                      icon: Zap,
                      color: 'from-orange-500 to-red-500'
                    }
                  ].map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <Card 
                        key={feature.step} 
                        className="group p-8 text-center space-y-6 shadow-medium hover:shadow-strong transition-all duration-500 hover:-translate-y-2 border-0 bg-gradient-card hover:bg-white"
                      >
                        <div className="relative">
                          <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto shadow-medium group-hover:shadow-strong transition-all duration-300 group-hover:scale-110`}>
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-medium">
                            {feature.step}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed text-base">
                            {feature.description}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* CTA after features */}
                <div className="text-center mt-16">
                  <Button
                    size="lg"
                    className="bg-gradient-cta hover:shadow-glow text-white font-bold text-xl px-12 py-6 h-auto rounded-xl transition-all duration-300 hover:scale-105 shadow-strong"
                    onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Sparkles className="w-6 h-6 mr-3" />
                    Try It Now - It's Free!
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-sectionSecondary border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 bg-gradient-cta rounded-xl flex items-center justify-center shadow-medium">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">CalorieWise</span>
            </div>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Making nutrition tracking simple, fast, and accessible for everyone.
            </p>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Built with AI precision for modern nutrition tracking
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;