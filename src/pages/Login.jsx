import { useState } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to log in. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-demol-primary p-demol-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-demol-xl">
          <h1 className="text-demol-text-primary text-3xl font-bold mb-demol-sm">De Mol</h1>
          <p className="text-demol-text-secondary">Log in om te stemmen</p>
        </div>

        <div className="bg-demol-bg-secondary p-demol-xl rounded-demol-lg shadow-demol-lg">
          <form onSubmit={handleSubmit} className="space-y-demol-md">
            {error && (
              <div className="bg-demol-error bg-opacity-10 text-demol-error p-demol-sm rounded-demol-sm text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-demol-text-secondary text-sm font-medium mb-demol-xs">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-demol-bg-primary border border-demol-border text-demol-text-primary rounded-demol-md px-demol-md py-demol-sm focus:outline-none focus:ring-2 focus:ring-demol-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-demol-text-secondary text-sm font-medium mb-demol-xs">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-demol-bg-primary border border-demol-border text-demol-text-primary rounded-demol-md px-demol-md py-demol-sm focus:outline-none focus:ring-2 focus:ring-demol-primary focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-demol-primary text-demol-text-primary py-demol-sm px-demol-md rounded-demol-md font-medium hover:bg-opacity-90 transition-all duration-demol-normal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bezig met inloggen...' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-demol-md text-center">
            <p className="text-demol-text-secondary text-sm">
              Nog geen account?{' '}
              <a href="/register" className="text-demol-primary hover:text-demol-accent transition-colors duration-demol-normal">
                Registreer hier
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 