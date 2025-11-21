import React, { useState, useEffect } from 'react';
import OnboardingStart from './OnboardingStart';
import OnboardingPlan from './OnboardingPlan';
import OnboardingBranding from './OnboardingBranding';
import OnboardingDomain from './OnboardingDomain';
import OnboardingComplete from './OnboardingComplete';

type OnboardingStep = 'start' | 'plan' | 'branding' | 'domain' | 'complete';

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('start');
  const [studioId, setStudioId] = useState<string>('');
  const [subdomain, setSubdomain] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');
  const [planName, setPlanName] = useState<string>('');

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedStudioId = localStorage.getItem('onboarding_studio_id');
    const savedSubdomain = localStorage.getItem('onboarding_subdomain');
    const savedPlanId = localStorage.getItem('onboarding_plan_id');
    const savedStep = localStorage.getItem('onboarding_current_step') as OnboardingStep;

    if (savedStudioId) setStudioId(savedStudioId);
    if (savedSubdomain) setSubdomain(savedSubdomain);
    if (savedPlanId) setPlanId(savedPlanId);
    if (savedStep && savedStudioId) {
      // Only resume if we have a studio_id (meaning start step was completed)
      setCurrentStep(savedStep);
    }
  }, []);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onboarding_current_step', currentStep);
  }, [currentStep]);

  const handleStartComplete = (newStudioId: string, newSubdomain: string) => {
    setStudioId(newStudioId);
    setSubdomain(newSubdomain);
    setCurrentStep('plan');
  };

  const handlePlanComplete = (selectedPlanId: string) => {
    setPlanId(selectedPlanId);
    setCurrentStep('branding');
  };

  const handleBrandingComplete = () => {
    setCurrentStep('domain');
  };

  const handleDomainComplete = () => {
    setCurrentStep('complete');
    // Clear localStorage after completion
    localStorage.removeItem('onboarding_studio_id');
    localStorage.removeItem('onboarding_subdomain');
    localStorage.removeItem('onboarding_plan_id');
    localStorage.removeItem('onboarding_current_step');
  };

  const handleBackToStart = () => {
    setCurrentStep('start');
  };

  const handleBackToPlan = () => {
    setCurrentStep('plan');
  };

  const handleBackToBranding = () => {
    setCurrentStep('branding');
  };

  return (
    <div>
      {currentStep === 'start' && (
        <OnboardingStart onComplete={handleStartComplete} />
      )}

      {currentStep === 'plan' && (
        <OnboardingPlan
          onComplete={handlePlanComplete}
          onBack={handleBackToStart}
        />
      )}

      {currentStep === 'branding' && studioId && (
        <OnboardingBranding
          studioId={studioId}
          onComplete={handleBrandingComplete}
          onBack={handleBackToPlan}
        />
      )}

      {currentStep === 'domain' && studioId && subdomain && (
        <OnboardingDomain
          studioId={studioId}
          subdomain={subdomain}
          onComplete={handleDomainComplete}
          onBack={handleBackToBranding}
        />
      )}

      {currentStep === 'complete' && subdomain && (
        <OnboardingComplete
          subdomain={subdomain}
          planName={planName}
        />
      )}
    </div>
  );
}
