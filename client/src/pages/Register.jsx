import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { SignUpButton } from '@clerk/clerk-react';
import useAuthStore from '../store/useAuthStore';
import AuthForm from '../components/auth/AuthForm';
import InputField from '../components/auth/InputField';
import Button from '../components/ui/Button';
import SectionWrapper from '../components/layout/SectionWrapper';
import Container from '../components/layout/Container';
import axiosInstance from '../lib/axios';
import { useToast } from '../context/ToastContext';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const Register = () => {
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const toast = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    const loadingToastId = toast.loading('Creating account...');
    try {
      const response = await axiosInstance.post('/auth/register', data);
      login(response.data.user, response.data.token);
      toast.update(loadingToastId, {
        type: 'success',
        title: 'Registration Complete',
        message: 'Your account has been created.',
        persistent: false,
      });
      navigate(response.data.user?.role === 'admin' ? '/admin' : '/');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setServerError(message);
      toast.update(loadingToastId, {
        type: 'error',
        title: 'Registration Failed',
        message,
        persistent: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionWrapper bgVariant="hero" className="min-h-[calc(100vh-4rem)] flex items-center justify-center pt-20">
      <Container>
        <AuthForm title="Create Account" subtitle="Join the portfolio ecosystem" onSubmit={handleSubmit(onSubmit)}>
          {serverError && <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-md text-red-500/90 text-sm text-center font-medium mb-2">{serverError}</div>}
          
          <InputField label="Full Name" id="name" type="text" placeholder="John Doe" register={register} error={errors.name} />
          <InputField label="Email Address" id="email" type="email" placeholder="you@domain.com" register={register} error={errors.email} />
          <InputField label="Password" id="password" type="password" placeholder="••••••••" register={register} error={errors.password} />
          <InputField label="Confirm Password" id="confirmPassword" type="password" placeholder="••••••••" register={register} error={errors.confirmPassword} />
          
          <Button variant="primary" type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs font-medium uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* <SignUpButton mode="modal">
            <Button type="button" variant="secondary" className="w-full flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              Google
            </Button>
          </SignUpButton> */}
          <SignUpButton>
            <Button type="button" variant="secondary" className="w-full flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              Register with Google
            </Button>
          </SignUpButton>

          <p className="text-center text-zinc-400 text-sm mt-6">
            Already have an account? <Link to="/login" className="text-white hover:underline transition-all font-medium">Log in</Link>
          </p>
        </AuthForm>
      </Container>
    </SectionWrapper>
  );
};

export default Register;
