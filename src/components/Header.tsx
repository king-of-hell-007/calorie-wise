import logo from '@/assets/caloriewise-logo.png';

export const Header = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-primary text-white p-4 shadow-strong">
      <div className="flex items-center gap-3">
        <img src={logo} alt="CalorieWise Logo" className="h-10 w-auto" />
        <h1 className="text-2xl font-bold">CalorieWise</h1>
      </div>
    </div>
  );
};