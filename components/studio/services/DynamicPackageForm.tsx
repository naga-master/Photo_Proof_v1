import React, { useState, useEffect } from 'react';
import { packageTypeService, PackageTypeAttributeSchema, FieldSchema } from '../../../services/packageTypeService';
import PackageTypeSelector from './PackageTypeSelector';
import FormFieldRenderer from './FormFieldRenderer';

interface DynamicPackageFormProps {
  packageTypeId?: string | null;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel: () => void;
  submitLabel?: string;
  isEditMode?: boolean;
}

const DynamicPackageForm: React.FC<DynamicPackageFormProps> = ({
  packageTypeId: initialPackageTypeId,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save Package',
  isEditMode = false,
}) => {
  const [packageTypeId, setPackageTypeId] = useState<string | null>(initialPackageTypeId || null);
  const [schema, setSchema] = useState<PackageTypeAttributeSchema | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Load schema when package type changes
  useEffect(() => {
    if (packageTypeId) {
      loadSchema(packageTypeId);
    } else {
      setSchema(null);
      // Clear form when no package type (creating new)
      if (!isEditMode) {
        setFormValues({});
      }
    }
  }, [packageTypeId, isEditMode]);

  // Initialize form values from initial values
  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);
  
  // Clear errors when form values change significantly
  useEffect(() => {
    setErrors({});
  }, [packageTypeId]);

  const loadSchema = async (typeId: string) => {
    try {
      setSchemaLoading(true);
      const loadedSchema = await packageTypeService.getPackageTypeSchema(typeId);
      setSchema(loadedSchema);
      
      // Initialize collapsed state - all sections expanded by default
      const collapsed: Record<string, boolean> = {};
      loadedSchema.sections.forEach((section, idx) => {
        collapsed[`section-${idx}`] = false;
      });
      setCollapsedSections(collapsed);
    } catch (err) {
      console.error('Failed to load package type schema:', err);
      alert('Failed to load package type schema');
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!schema) {
      alert('Please select a package type');
      return false;
    }

    // Validate required fields
    schema.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          const value = formValues[field.name];
          
          // Check if field should be visible based on dependencies
          if (field.dependency) {
            const dependencyValue = formValues[field.dependency.field];
            if (dependencyValue !== field.dependency.value) {
              return; // Skip validation for hidden fields
            }
          }
          
          if (value === null || value === undefined || value === '') {
            newErrors[field.name] = `${field.label} is required`;
          }
        }
        
        // Validate number ranges
        if (field.type === 'number' && formValues[field.name] !== null && formValues[field.name] !== undefined) {
          const numValue = Number(formValues[field.name]);
          if (field.min !== undefined && numValue < field.min) {
            newErrors[field.name] = `${field.label} must be at least ${field.min}`;
          }
          if (field.max !== undefined && numValue > field.max) {
            newErrors[field.name] = `${field.label} must be at most ${field.max}`;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data for submission
      const submissionData = {
        package_type_id: packageTypeId,
        ...formValues,
      };
      
      onSubmit(submissionData);
    } catch (err) {
      console.error('Form submission error:', err);
      alert('Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const shouldShowField = (field: FieldSchema): boolean => {
    if (!field.dependency) return true;
    
    const dependencyValue = formValues[field.dependency.field];
    return dependencyValue === field.dependency.value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Package Type Selector */}
      <PackageTypeSelector
        value={packageTypeId}
        onChange={setPackageTypeId}
        disabled={isEditMode} // Don't allow changing type in edit mode
      />

      {/* Schema Loading State */}
      {schemaLoading && (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading form fields...</p>
        </div>
      )}

      {/* Dynamic Form Sections */}
      {schema && !schemaLoading && (
        <div className="space-y-4">
          {schema.sections.map((section, sectionIdx) => {
            const sectionKey = `section-${sectionIdx}`;
            const isCollapsed = collapsedSections[sectionKey];
            
            // Filter visible fields in section
            const visibleFields = section.fields.filter(shouldShowField);
            
            if (visibleFields.length === 0) return null;

            return (
              <div key={sectionKey} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <h3 className="text-base font-semibold text-gray-800">{section.title}</h3>
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? '' : 'transform rotate-180'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Section Fields */}
                {!isCollapsed && (
                  <div className={`px-4 py-4 ${
                    visibleFields.every(f => f.type === 'toggle')
                      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                      : 'space-y-4'
                  }`}>
                    {visibleFields.map(field => (
                      <FormFieldRenderer
                        key={field.name}
                        field={field}
                        value={formValues[field.name]}
                        onChange={handleFieldChange}
                        error={errors[field.name]}
                        disabled={loading}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No Package Type Selected */}
      {!packageTypeId && !schemaLoading && (
        <div className="py-12 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">Select a package type to begin</p>
          <p className="text-sm mt-1">Choose a package type from the dropdown above to load the form fields</p>
        </div>
      )}

      {/* Form Actions */}
      {schema && !schemaLoading && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {submitLabel}
          </button>
        </div>
      )}
    </form>
  );
};

export default DynamicPackageForm;
