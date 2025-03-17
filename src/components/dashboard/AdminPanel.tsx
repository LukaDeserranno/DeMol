import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function AdminPanel() {
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold text-purple-800">Admin Panel</CardTitle>
        <CardDescription className="mt-1">
          Beheer voting rondes en kandidaten
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <Button 
          onClick={() => navigate('/admin/rounds')} 
          className="w-full mb-3 bg-purple-700 hover:bg-purple-800 transition-all duration-300 py-5 h-auto rounded-lg"
        >
          Beheer Voting Rondes
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/statistics')}
          className="w-full border-purple-200 text-purple-700 hover:bg-purple-100 transition-all duration-300 py-5 h-auto rounded-lg"
        >
          Bekijk Statistieken
        </Button>
      </CardContent>
    </Card>
  );
} 