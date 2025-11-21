import React from 'react';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';

/**
 * Standalone onboarding page that can be accessed independently
 * Access via: http://photoapp.local:3001/onboarding/start
 * 
 * Note: Does NOT use StudioThemeProvider since no studio exists yet during onboarding
 */
export default function OnboardingPage() {
  return <OnboardingFlow />;
}
