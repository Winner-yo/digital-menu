'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Phone, Store, MapPin, UtensilsCrossed } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
}

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        restaurantName: data.restaurantName,
        restaurantAddress: data.restaurantAddress,
        restaurantPhone: data.restaurantPhone,
      });
      toast.success('Restaurant registered successfully!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand shadow-food-card flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Register Your Restaurant</h1>
          <p className="text-gray-500 mt-1 text-sm">Get your digital menu in minutes</p>
        </div>

        <div className="bg-white rounded-3xl shadow-card-hover p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Owner Info */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Owner Information</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name" placeholder="Abebe"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.firstName?.message}
                  {...register('firstName', { required: 'Required' })}
                />
                <Input
                  label="Last Name" placeholder="Kebede"
                  error={errors.lastName?.message}
                  {...register('lastName', { required: 'Required' })}
                />
              </div>
            </div>

            <Input
              label="Email" type="email" placeholder="owner@restaurant.com"
              leftIcon={<Mail className="w-4 h-4" />} fullWidth
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
              })}
            />

            <Input
              label="Phone Number" placeholder="0912345678"
              leftIcon={<Phone className="w-4 h-4" />} fullWidth
              hint="Ethiopian phone number (09xxxxxxxx or +251xxxxxxxxx)"
              error={errors.phone?.message}
              {...register('phone', { required: 'Phone is required' })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
              />
              <Input
                label="Confirm Password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Required',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
            </div>

            {/* Restaurant Info */}
            <div className="pt-2">
              <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Restaurant Information</p>
              <div className="space-y-3">
                <Input
                  label="Restaurant Name" placeholder="Habesha Restaurant"
                  leftIcon={<Store className="w-4 h-4" />} fullWidth
                  error={errors.restaurantName?.message}
                  {...register('restaurantName', { required: 'Restaurant name is required' })}
                />
                <Input
                  label="Address" placeholder="Bole, Addis Ababa"
                  leftIcon={<MapPin className="w-4 h-4" />} fullWidth
                  {...register('restaurantAddress')}
                />
                <Input
                  label="Restaurant Phone" placeholder="011XXXXXXX"
                  leftIcon={<Phone className="w-4 h-4" />} fullWidth
                  {...register('restaurantPhone')}
                />
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isLoading} className="mt-2">
              Create Restaurant Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
