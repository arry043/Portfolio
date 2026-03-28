import React, { useEffect } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import useBackendAuthSync from '../hooks/useBackendAuthSync';
import SectionWrapper from '../components/layout/SectionWrapper';
import Container from '../components/layout/Container';

const SSOCallback = () => {
  const navigate = useNavigate();
  const { syncSession } = useBackendAuthSync();

  useEffect(() => {
    let isMounted = true;

    const exchangeToken = async () => {
      try {
        const result = await syncSession({ force: true });
        const role = result?.user?.role;
        if (isMounted) {
          navigate(role === 'admin' ? '/admin' : '/');
        }
      } catch {
        if (isMounted) {
          navigate('/login');
        }
      }
    };

    exchangeToken();

    return () => {
      isMounted = false;
    };
  }, [syncSession, navigate]);

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
