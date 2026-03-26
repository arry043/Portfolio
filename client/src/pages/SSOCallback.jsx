import React, { useEffect } from 'react';
import { useAuth, useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import axiosInstance from '../lib/axios';
import SectionWrapper from '../components/layout/SectionWrapper';
import Container from '../components/layout/Container';

const SSOCallback = () => {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  useEffect(() => {
    // Sync Clerk session to our Database and JWT format immediately upon retrieval
    const exchangeToken = async () => {
      // Must wait for clerk session to become explicitly tied
      if (isAuthLoaded && isUserLoaded && isSignedIn && user) {
        try {
          const token = await getToken();
          const response = await axiosInstance.post('/auth/google', {
            token,
            email: user.primaryEmailAddress.emailAddress,
            name: user.fullName
          });
          login(response.data.user, response.data.token);
          navigate(response.data.user?.role === 'admin' ? '/admin' : '/');
        } catch (error) {
          console.error("SSO Exchange failed", error);
          navigate('/login');
        }
      }
    };
    exchangeToken();
  }, [isAuthLoaded, isUserLoaded, isSignedIn, user, getToken, navigate, login]);

  return (
    <SectionWrapper bgVariant="hero" className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <Container>
        <AuthenticateWithRedirectCallback signUpForceRedirectUrl="/sso-callback" />
        <div className="text-center space-y-4">
          <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-zinc-800 border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-zinc-400 font-medium">Authenticating identity with Google...</p>
        </div>
      </Container>
    </SectionWrapper>
  );
};
export default SSOCallback;
