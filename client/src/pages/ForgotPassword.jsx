import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Mail className="mx-auto text-primary-500 mb-3" size={32} />
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Please contact support to reset your account password. This feature will be available directly in-app soon.
        </p>
        <Link to="/auth/login" className="text-primary-600 text-sm font-medium hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
