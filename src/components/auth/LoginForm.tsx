import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check your email and try again.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(`Failed to sign in: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-red-500/20 filter blur-3xl"></div>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/20 filter blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <img 
            src="/images/logo/de-mol-logo.png" 
            alt="De Mol" 
            className="h-16 mx-auto mb-6 drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.src = "https://www.goplay.be/media/b0ajq2hs/de-mol-2024-play.png";
            }}
          />
        </div>
        
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-6 space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welkom terug</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Log in bij je De Mol account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-6">
            {error && (
              <div className="p-3 mb-5 text-sm text-red-800 bg-red-100 rounded-xl border border-red-200 flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="h-11 rounded-xl border-gray-300 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Wachtwoord
                  </Label>
                  <Link to="/reset-password" className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors">
                    Wachtwoord vergeten?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-gray-300 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inloggen...
                  </span>
                ) : 'Inloggen'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="pb-8 pt-0 flex justify-center">
            <div className="text-sm text-gray-600">
              Nog geen account?{' '}
              <Link to="/register" className="font-medium text-red-600 hover:text-red-800 transition-colors">
                Registreer nu
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 