/**
 * Validation utilities for upload wizard
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface Step1ValidationData {
  title?: string;
  clientId?: string;
  shootDate?: string;
  packageId?: string;
  layout?: string;
  newClientDetails?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface Step2ValidationData {
  detectedFolders: any[];
  folderMap: any[];
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Step 1: Project Setup
 */
export const validateStep1 = (data: Step1ValidationData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Required: Project Title
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Project title is required';
  }

  // Required: Client
  if (!data.clientId || data.clientId === '') {
    errors.clientId = 'Please select a client or create a new one';
  }

  // If creating new client, validate new client details
  if (data.clientId === 'new') {
    if (!data.newClientDetails?.name || data.newClientDetails.name.trim() === '') {
      errors.name = 'Full name is required';
    }

    if (!data.newClientDetails?.email || data.newClientDetails.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!isValidEmail(data.newClientDetails.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone is optional, but validate format if provided
    if (data.newClientDetails?.phone && data.newClientDetails.phone.trim() !== '') {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(data.newClientDetails.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }
  }

  // Required: Shoot Date
  if (!data.shootDate || data.shootDate === '') {
    errors.shootDate = 'Shoot date is required';
  } else {
    // Validate date format
    const date = new Date(data.shootDate);
    if (isNaN(date.getTime())) {
      errors.shootDate = 'Please enter a valid date';
    }
  }

  // Required: Service Package
  if (!data.packageId || data.packageId === '') {
    errors.packageId = 'Please select a service package';
  }

  // Required: Layout Preset (should always be set, but check anyway)
  if (!data.layout || data.layout === '') {
    errors.layout = 'Please select a layout preset';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Step 2: Folder Mapping
 */
export const validateStep2 = (data: Step2ValidationData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Required: At least one folder must be selected
  if (!data.detectedFolders || data.detectedFolders.length === 0) {
    errors.folders = 'Please select at least one folder to upload';
  }

  // Validate folder mappings
  if (data.folderMap && data.folderMap.length > 0) {
    data.folderMap.forEach((mapping, index) => {
      if (!mapping.targetAlbumName || mapping.targetAlbumName.trim() === '') {
        errors[`folderMap_${index}`] = `Album name for folder "${mapping.sourcePath}" cannot be empty`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get validation error message for display
 */
export const getValidationErrorMessage = (errors: Record<string, string>): string => {
  const errorMessages = Object.values(errors);
  if (errorMessages.length === 0) return '';
  if (errorMessages.length === 1) return errorMessages[0];
  return `Please fix ${errorMessages.length} validation errors`;
};

/**
 * Check if all required fields are filled (for enabling/disabling next button)
 */
export const canProceedFromStep1 = (data: Step1ValidationData): boolean => {
  const validation = validateStep1(data);
  return validation.isValid;
};

export const canProceedFromStep2 = (data: Step2ValidationData): boolean => {
  const validation = validateStep2(data);
  return validation.isValid;
};
