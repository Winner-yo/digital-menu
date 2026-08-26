'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, UtensilsCrossed } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand shadow-food-card flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Restaurant Login</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to manage your restaurant</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card-hover p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="owner@restaurant.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              fullWidth
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
            />

            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(!showPass)} className="p-1">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              fullWidth
              {...register('password', { required: 'Password is required' })}
            />

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-600 font-semibold hover:text-primary-700">
                Register your restaurant
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-amber-700 font-medium mb-1">Demo Credentials</p>
          <p className="text-xs text-amber-600">Email: owner@habesha.com</p>
          <p className="text-xs text-amber-600">Password: Password123!</p>
        </div>
      </div>
    </div>
  );
}
