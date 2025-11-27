Dynamic Package-Based Feature Restriction System - Implementation Plan

Executive Summary

Transform the current simple package system into a comprehensive, type-driven, automated restriction engine that enforces package limits on both studio and client
sides.

──────────────────────────────────────────

1.  Package Type System Design

    1.1 Core Package Types (Predefined with Industry Research)

**Wedding Photography**

Based on Indian wedding market research, includes:
• Photo Selection Limit: Max selectable photos (e.g., 200-500)
• Video Support: Toggle + Max GB limit (e.g., 50GB)
• Event Coverage: Reception ☑, Wedding Ceremony ☑, Pre-wedding ☑, Outdoor ☑
• Photography Types:
• Candid Photography (count)
• Candid Videography (count)
• Traditional Photography (count)
• Traditional Videography (count)
• Album Deliverables: Quality (Premium/Standard), Type (Photobook/Coffee Table), Size (10x14, 12x15), Pages (60-100)
• Frame Complements: Count + Size options
• Physical Storage: Pendrive ☑, DVD ☑
• Editing Period: Months from upload date
• Retention Period: Years + Months before archival
• Archival Settings: Enable ☑ + Archive after (Years + Months)
• WhatsApp Integration: Toggle for notifications
• Customer Support: 24/7, Business Hours, On-demand
• Features List: Text area (one per line)
• Description: Text area
• Price: Number

**Corporate Photography**

Based on B2B photography market standards:
• Headshot Count: Number of people/shots
• Session Duration: Hours
• Photo Selection Limit: Final deliverables count
• Turnaround Time: Days
• Retouching Level: Basic/Professional/Advanced
• Background Options: White/Custom/Multiple
• High-Res Access: Toggle
• Usage Rights: Internal Only/Marketing/Unlimited
• Location: On-site ☑, Studio ☑
• Additional Photographers: Count
• Batch Discount: Percentage for >10 people
• Retention Period: Years
• Team Photo: Toggle
• Features & Price: Same as wedding

**Event Photography**

Conferences, parties, corporate events:
• Coverage Hours: Number
• Photographer Count: Number
• Photo Selection Limit: Max deliverables
• Video Highlights: Toggle + Duration (minutes)
• Online Gallery Duration: Months
• Drone Coverage: Toggle
• Live Streaming: Toggle
• Same-Day Preview: Toggle
• Photo Booth: Toggle
• Retention Period: Years
• Features & Price: Same structure

**Maternity & Newborn**
• Session Count: Maternity + Newborn (1-2 each)
• Session Duration: Hours per session
• Photo Selection Limit: Final deliverables
• Wardrobe Access: Toggle
• Props Included: Toggle
• Print Inclusions: Count + Sizes
• Album: Toggle + Specifications
• Digital Files: Count
• Milestone Sessions: Toggle (3m, 6m, 12m)
• Family Photos: Toggle
• Retention Period: Years
• Features & Price: Same structure

**Product/E-commerce Photography**
• Product Count: Number of items
• Images Per Product: Angles/variations
• Background Type: White/Lifestyle/Both
• Retouching Level: Basic/Advanced
• 360° View: Toggle
• Model/Mannequin: Toggle
• File Formats: JPG/PNG/RAW
• Turnaround Time: Days
• Revision Rounds: Count
• Usage Rights: E-commerce/Marketing/All
• Features & Price: Same structure

**Portrait Photography**

Individual/family portraits:
• Session Duration: Hours
• Photo Selection Limit: Final deliverables
• Location: Studio/Outdoor/Home
• Outfit Changes: Count
• Backdrop Options: Count
• Print Inclusions: Sizes + Count
• Digital Files: All/Selected
• Retouching: Basic/Professional
• Album Option: Toggle + Specs
• Retention Period: Years
• Features & Price: Same structure

1.2 Custom Package Types

Users can create new package types with:
• Type Name: String
• Base Template: Start from existing type or blank
• Custom Attributes: Key-value pairs for unique requirements

──────────────────────────────────────────

2.  Database Schema Changes

    2.1 New Table: `package_types`

sql
CREATE TABLE package_types (
id VARCHAR(36) PRIMARY KEY,
name VARCHAR(100) NOT NULL UNIQUE,
display_name VARCHAR(100) NOT NULL,
description TEXT,
icon VARCHAR(50), -- Icon identifier
is_predefined BOOLEAN DEFAULT FALSE,
is_active BOOLEAN DEFAULT TRUE,
attribute_schema JSON NOT NULL, -- Defines form fields dynamically
created_by VARCHAR(36) REFERENCES users(id),
created_at TIMESTAMP,
updated_at TIMESTAMP
);

2.2 Update: `service_packages` Table

sql
ALTER TABLE service_packages
ADD COLUMN package_type_id VARCHAR(36) REFERENCES package_types(id),
ADD COLUMN restrictions JSON, -- Stores all package-specific restrictions
ADD COLUMN deliverables JSON, -- Structured deliverables
ADD COLUMN support_config JSON, -- Support options
ADD COLUMN lifecycle_config JSON; -- Retention, archival, editing periods

     -- Example restrictions JSON:
     {
       "photo_selection_limit": 300,
       "video_support": {
         "enabled": true,
         "max_gb": 50
       },
       "editing_period_months": 6,
       "retention_period": {"years": 3, "months": 0},
       "archival": {
         "enabled": true,
         "archive_after": {"years": 3, "months": 6}
       },
       "event_coverage": {
         "reception": true,
         "wedding": true,
         "outdoor": true
       },
       "photography_counts": {
         "candid_photo": 200,
         "traditional_photo": 150,
         "candid_video": 10,
         "traditional_video": 5
       }
     }

2.3 Update: `projects` Table

sql
ALTER TABLE projects
ADD COLUMN package_snapshot JSON, -- Capture package config at project creation
ADD COLUMN usage_stats JSON; -- Track actual usage against limits

     -- Example usage_stats:
     {
       "photos_selected": 245,
       "video_gb_used": 32.5,
       "last_edit_date": "2025-11-15",
       "archival_scheduled_date": "2028-05-27"
     }

2.4 Indexes for Performance

sql
CREATE INDEX idx_packages_type ON service_packages(package_type_id);
CREATE INDEX idx_projects_package ON projects(package_id);

──────────────────────────────────────────

3.  Backend Implementation

    3.1 Package Type Management

New File: app/routers/package_types.py
• GET /v2/package-types - List all available types
• GET /v2/package-types/{type_id} - Get type details with schema
• POST /v2/package-types - Create custom type (studio users)
• PATCH /v2/package-types/{type_id} - Update custom type
• DELETE /v2/package-types/{type_id} - Deactivate type

3.2 Enhanced Package Service

Update: app/routers/service_packages.py
• Add validation based on package type schema
• Store complete restriction config
• Snapshot package config when assigned to project

3.3 Restriction Enforcement Middleware

New File: app/middleware/package_restrictions.py

Key Functions:

python
def validate_photo_selection(user_id, project_id, photo_id):
"""Check if user can select another photo"""
project = get_project(project_id)
package_snapshot = project.package_snapshot
limit = package_snapshot['restrictions']['photo_selection_limit']

         current_count = count_user_selections(user_id, project_id)
         if current_count >= limit:
             raise HTTPException(
                 status_code=400,
                 detail=f"Selection limit reached ({limit} photos)"
             )
         return True

     def check_editing_period(project_id):
         """Verify if editing is still allowed"""
         project = get_project(project_id)
         editing_months = project.package_snapshot['restrictions']['editing_period_months']
         last_upload = project.photos[0].created_at  # First upload

         deadline = last_upload + timedelta(days=editing_months * 30)
         if datetime.now() > deadline:
             raise HTTPException(
                 status_code=403,
                 detail="Editing period has expired"
             )
         return True

     def calculate_archival_date(project_id):
         """Calculate when project should be archived"""
         project = get_project(project_id)
         config = project.package_snapshot['restrictions']['archival']
         if not config['enabled']:
             return None

         start_date = project.created_at
         years = config['archive_after']['years']
         months = config['archive_after']['months']

         return start_date + relativedelta(years=years, months=months)

3.4 Photo Selection API Updates

Update: app/routers/photos.py

python
@router.post("/{photo_id}/select")
async def select_photo(
photo_id: int,
project_id: int,
current_user = Depends(get_current_user)
): # Enforce package restrictions
validate_photo_selection(current_user.id, project_id, photo_id)

         # Rest of selection logic...

3.5 Background Jobs for Lifecycle Management

New File: app/jobs/package_lifecycle.py

• Archival Job (Daily cron):
• Find projects past archival date
• Move to cold storage
• Update project status
• Notify users

• Retention Cleanup Job (Weekly cron):
• Check retention period expiry
• Notify before deletion
• Delete old projects

3.6 WhatsApp Integration Hook

New File: app/integrations/whatsapp.py
• Check if package enables WhatsApp
• Send notifications for selections, comments, etc.
• Integrate with WhatsApp Business API

──────────────────────────────────────────

4.  Frontend Implementation

    4.1 Package Type Management UI

New Component: components/studio/packageTypes/PackageTypesManager.tsx
• View all predefined types
• Create custom types
• Edit custom type attributes
• Deactivate types

4.2 Dynamic Package Form Builder

New Component: components/studio/services/DynamicPackageForm.tsx

Features:
• Fetch package type schema from API
• Render form fields dynamically based on schema
• Field types: text, number, toggle, dropdown, checkbox group, textarea
• Organized into collapsible sections:
• Basic Info (name, description, price)
• Coverage & Deliverables
• Technical Specifications
• Timeline & Support
• Features
• Real-time validation
• Preview package card while editing

Example Structure:

tsx
interface PackageTypeSchema {
sections: {
title: string;
fields: Array<{
name: string;
type: 'text' | 'number' | 'toggle' | 'select' | 'multi-select' | 'textarea';
label: string;
placeholder?: string;
options?: Array<{label: string, value: string}>;
required: boolean;
min?: number;
max?: number;
dependency?: {field: string, value: any}; // Show only if condition met
}>;
}[];
}

4.3 Updated ServicesPage.tsx
• Replace hardcoded form with <DynamicPackageForm />
• Add package type selector dropdown
• "Create New Type" button → opens type manager
• Display packages grouped by type
• Show restriction badges (e.g., "Max 300 photos", "6 months editing")

4.4 Client-Side Selection Counter

Update: components/GalleryPage.tsx & components/Lightbox.tsx

Add selection counter badge:

tsx

<div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4">
<div className="text-sm text-gray-600">Photo Selections</div>
<div className="text-2xl font-bold">
{selectedCount} / {packageLimit}
</div>
<div className="w-full bg-gray-200 rounded-full h-2 mt-2">
<div
className="bg-blue-600 h-2 rounded-full"
style={{width: `${(selectedCount/packageLimit)*100}%`}}
/>
</div>
</div>

4.5 Selection Enforcement
• Disable select button when limit reached
• Show toast notification: "Selection limit reached (300/300)"
• Display package restrictions in project details
• Show editing deadline countdown

4.6 Project Creation Flow Update

Update: components/studio/upload/Step1_ProjectSetup.tsx
• When package selected, fetch and display restrictions
• Show warning if package limits are restrictive
• Preview what client will see

──────────────────────────────────────────

5.  UI/UX Design Principles

    5.1 Form Organization
    • Progressive Disclosure: Show basic fields first, advanced in collapsible sections
    • Smart Defaults: Pre-fill common values based on package type
    • Contextual Help: Tooltip icons explaining each restriction
    • Visual Hierarchy: Group related fields with subtle borders/backgrounds
    • Responsive Design: Mobile-friendly form layout

    5.2 Package Display
    • Card Layout: Visual cards showing packages by type
    • Restriction Badges: Quick-view limits as colored badges
    • Comparison View: Side-by-side package comparison
    • Client-Friendly Language: "Up to 300 photos" instead of "photo_selection_limit: 300"

    5.3 Client Experience
    • Progress Indicators: Always show current vs. limit
    • Gentle Warnings: "You're approaching your selection limit (280/300)"
    • Clear CTAs: Disabled buttons with explanatory text
    • Package Summary: Display what's included in their package

──────────────────────────────────────────

6.  Additional Features (Based on Competitor Analysis)

    6.1 Package Comparison Tool

Allow clients to compare packages side-by-side before studio creates project.

6.2 Package Upgrade Flow

Clients can request upgrade to higher tier if they exceed limits.

6.3 Usage Analytics

Studio dashboard showing:
• Most popular packages
• Average usage vs. limits
• Revenue by package type

6.4 Smart Recommendations

Suggest package based on:
• Event type
• Guest count
• Duration
• Location

6.5 Time-Based Pricing

Seasonal pricing adjustments per package.

──────────────────────────────────────────

7.  Implementation Phases

Phase 1: Foundation (Week 1-2)

1.  Create package_types table and seed predefined types
2.  Update service_packages schema
3.  Build PackageTypesManager UI
4.  Basic CRUD for package types

Phase 2: Dynamic Forms (Week 3-4)

1.  Build DynamicPackageForm component
2.  Integrate with package type schemas
3.  Update ServicesPage to use dynamic forms
4.  Testing with all predefined types

Phase 3: Enforcement Backend (Week 5-6)

1.  Implement restriction middleware
2.  Update photo selection API
3.  Add validation to relevant endpoints
4.  Package snapshot on project creation

Phase 4: Client-Side Restrictions (Week 7)

1.  Add selection counter to gallery
2.  Enforce limits in UI
3.  Display package details to clients
4.  Restriction error handling

Phase 5: Lifecycle Management (Week 8-9)

1.  Build archival background job
2.  Implement retention cleanup
3.  Email/notification system for deadlines
4.  WhatsApp integration (if enabled)

Phase 6: Polish & Analytics (Week 10)

1.  Usage analytics dashboard
2.  Package comparison tool
3.  Upgrade request flow
4.  Documentation and testing

──────────────────────────────────────────

8.  Technical Considerations

    8.1 Performance
    • Cache package schemas in frontend
    • Index heavily queried fields (package_type_id, project.package_id)
    • Lazy load package details
    • Batch validation checks

    8.2 Backward Compatibility
    • Existing packages without type: assign "Custom" type
    • Migration script to convert old packages
    • Graceful fallback if restrictions missing

    8.3 Security
    • Validate all restrictions server-side
    • Don't trust client-side limits
    • Audit log for package changes
    • Prevent tampering with package_snapshot

    8.4 Scalability
    • Background jobs use queue (Celery/Redis)
    • Archival uses batch processing
    • CDN for archived project assets

──────────────────────────────────────────

9.  Testing Strategy

    9.1 Unit Tests
    • Package type CRUD
    • Restriction validation logic
    • Selection counter calculations

    9.2 Integration Tests
    • End-to-end package creation → project creation → client selection
    • Archival job execution
    • Restriction enforcement across APIs

    9.3 User Testing
    • Studio users create packages with various types
    • Clients interact with restricted galleries
    • Upgrade flow testing

──────────────────────────────────────────

10. Documentation Needs

1. Studio User Guide: How to create dynamic packages
1. API Documentation: New endpoints and schemas
1. Package Type Schema Reference: For custom type creation
1. Migration Guide: For existing studios

──────────────────────────────────────────

This plan provides a complete, scalable, and user-friendly package restriction system that automates client-side and studio-side enforcement based on
industry-standard photography package structures.

Package Restriction System - Detailed Change Breakdown & Estimates

Database Changes (Total: 8-12 hours)

1.  New Tables to Create

Estimated: 4-6 hours

• `package_types` table
• 10 columns: id, name, display_name, description, icon, is_predefined, is_active, attribute_schema (JSON), created_by, timestamps
• 3 indexes: primary key, unique on name, index on is_active
• Seed data for 6 predefined types (Wedding, Corporate, Event, Maternity, Product, Portrait)

• Migration script to populate predefined package types with their attribute schemas

2.  Existing Tables to Modify

Estimated: 4-6 hours

• `service_packages` table - Add 4 new columns:
• package_type_id (VARCHAR(36), foreign key to package_types)
• restrictions (JSON) - stores all limit configurations
• deliverables (JSON) - structured deliverable specifications
• lifecycle_config (JSON) - retention, archival, editing periods
• Add 1 index on package_type_id
• Backfill existing packages with "Custom" type

• `projects` table - Add 2 new columns:
• package_snapshot (JSON) - frozen package config at creation time
• usage_stats (JSON) - tracks client usage vs limits
• Add 1 index on package_id
• Backfill existing projects with empty snapshots

3.  Data Migration Scripts
    • Convert existing package data to new schema
    • Set default restrictions for existing packages
    • Initialize usage_stats for active projects

──────────────────────────────────────────

Backend Changes (Total: 60-80 hours)

1.  New API Endpoints (Package Types)

Estimated: 12-16 hours

New Router: app/routers/package_types.py
• GET /v2/package-types - List all types with schemas
• GET /v2/package-types/{type_id} - Get specific type details
• POST /v2/package-types - Create custom type (studio only)
• PATCH /v2/package-types/{type_id} - Update custom type
• DELETE /v2/package-types/{type_id} - Soft delete/deactivate
• Includes: validation, permissions, error handling, tests

2.  Enhanced Service Package Endpoints

Estimated: 10-14 hours

Update: app/routers/service_packages.py
• Modify POST /v2/packages - Add type selection, dynamic validation
• Modify PATCH /v2/packages/{package_id} - Handle restrictions JSON
• Add GET /v2/packages/{package_id}/schema - Return form schema
• Update response models to include type info and restrictions
• Validation logic for each package type's attribute schema

3.  Restriction Enforcement Middleware

Estimated: 16-20 hours

New File: app/middleware/package_restrictions.py
• validate_photo_selection() - Check selection count vs limit
• check_video_upload_limit() - Verify video GB usage
• check_editing_period() - Validate if editing still allowed
• check_whatsapp_integration_enabled() - Feature toggle check
• get_package_restrictions() - Helper to fetch project restrictions
• calculate_usage_stats() - Update project usage tracking
• Integration with existing photo selection/upload endpoints

4.  Photo & Project API Updates

Estimated: 8-10 hours

Update: app/routers/photos.py
• Modify POST /{photo_id}/select - Add restriction validation
• Add GET /projects/{project_id}/selection-status - Return count/limit
• Update response to include restriction info

Update: app/routers/projects.py
• Modify POST /v2/projects - Snapshot package config on creation
• Add GET /v2/projects/{project_id}/restrictions - Return restrictions
• Update project response to include usage_stats

5.  Background Jobs & Lifecycle Management

Estimated: 12-16 hours

New File: app/jobs/package_lifecycle.py
• Daily archival job - Find & process projects past archival date
• Weekly retention cleanup job - Delete expired projects
• Notification job - Send reminders before deadlines
• Update project status based on lifecycle rules

New File: app/jobs/usage_tracking.py
• Background task to update usage_stats
• Calculate storage usage per project
• Track selection counts, video GB usage

6.  Schema Models & Validation

Estimated: 6-8 hours

New File: app/schemas/package_types.py
• PackageTypeCreate, PackageTypeUpdate, PackageTypeResponse
• PackageTypeSchema (for attribute definitions)
• FieldSchema models for dynamic form rendering

Update: app/schemas/invoice.py (service package schemas)
• Add type_id field
• Add restrictions, deliverables, lifecycle_config fields
• Validation schemas for each package type

7.  Integration Services

Estimated: 6-8 hours

New File: app/integrations/whatsapp.py
• Check if package enables WhatsApp integration
• Send notification function (placeholder for actual API integration)
• Message templating

Update: Notification service to respect package communication settings

──────────────────────────────────────────

Frontend Changes (Total: 70-90 hours)

1.  Package Type Management

Estimated: 14-18 hours

New Files (3 components):
• components/studio/packageTypes/PackageTypesManager.tsx - Main manager view
• components/studio/packageTypes/PackageTypeCard.tsx - Display type cards
• components/studio/packageTypes/CustomTypeEditor.tsx - Create/edit custom types

Features:
• View all predefined types with descriptions
• Create new custom package type
• Edit custom type attributes
• Deactivate/reactivate types
• Icon selection for types

2.  Dynamic Package Form System

Estimated: 20-26 hours

New Files (5 components):
• components/studio/services/DynamicPackageForm.tsx - Main form renderer
• components/studio/services/FormFieldRenderer.tsx - Individual field types
• components/studio/services/PackageTypeSelector.tsx - Type dropdown
• components/studio/services/PackagePreview.tsx - Live preview card
• components/studio/services/RestrictionsSummary.tsx - Visual restrictions display

Features:
• Fetch package type schema from API
• Dynamically render 15+ field types (text, number, toggle, select, multi-select, etc.)
• Conditional field visibility based on dependencies
• Real-time validation with error messages
• Organized into collapsible sections (4-6 sections per type)
• Auto-save draft functionality
• Preview mode showing client-facing view

3.  Updated Services Page

Estimated: 10-12 hours

Update: components/studio/services/ServicesPage.tsx
• Replace static form with DynamicPackageForm
• Add package type filter/grouping
• Add "Create New Type" button
• Display restriction badges on package cards
• Enhanced package comparison view
• Bulk operations (activate/deactivate multiple)

4.  Service Layer Updates

Estimated: 8-10 hours

Update: services/servicePackageService.ts
• Add package type endpoints
• Add schema fetching
• Handle restrictions JSON formatting
• Validation helpers

New File: services/packageTypeService.ts
• CRUD operations for package types
• Schema fetching and caching
• Type conversion utilities

5.  Client-Side Selection Enforcement

Estimated: 14-18 hours

Update: components/GalleryPage.tsx
• Add floating selection counter widget (shows X/Y)
• Progress bar visualization
• Disable photo selection when limit reached
• Display package restrictions panel
• Show editing deadline countdown
• Warning toasts when approaching limit

Update: components/Lightbox.tsx
• Disable select button when limit reached
• Show inline restriction message
• Update counter in real-time
• Handle API restriction errors gracefully

New Component: components/client/SelectionLimitWidget.tsx
• Reusable counter component
• Animated progress
• Warning states

6.  Project Creation Flow Updates

Estimated: 8-10 hours

Update: components/studio/upload/Step1_ProjectSetup.tsx
• Package selector shows restrictions preview
• Display client-facing limits
• Warning if very restrictive package selected
• Package comparison helper
• Auto-populate project settings from package

Update: components/studio/upload/UploadContext.tsx
• Store package restrictions in context
• Validate uploads against package limits

7.  Project Details & Analytics

Estimated: 10-12 hours

New Component: components/studio/projects/PackageUsagePanel.tsx
• Visual usage stats vs package limits
• Charts showing selection progress
• Storage usage indicators
• Editing deadline status
• Archival schedule display

Update: components/studio/ClientDetailsPage.tsx
• Show package restrictions for each project
• Usage summary across all client projects

8.  Type Definitions & Utilities

Estimated: 6-8 hours

Update: types.ts
• Add PackageType interfaces
• Add PackageRestrictions interfaces
• Add PackageTypeSchema interfaces
• Add UsageStats interfaces

New File: lib/packageHelpers.ts
• Restriction validation helpers
• Usage calculation utilities
• Date/deadline calculators
• Formatting helpers for restrictions display

──────────────────────────────────────────

Testing & Quality Assurance (Total: 30-40 hours)

1.  Backend Testing

Estimated: 16-20 hours

• Unit tests for restriction middleware (8 test files)
• Integration tests for package lifecycle jobs
• API endpoint tests for new routes
• Validation logic tests
• Migration testing with sample data

2.  Frontend Testing

Estimated: 10-14 hours

• Component tests for dynamic forms
• Integration tests for selection enforcement
• E2E tests: package creation → project creation → client selection
• Cross-browser testing for form rendering
• Mobile responsiveness testing

3.  User Acceptance Testing

Estimated: 4-6 hours

• Studio user flow testing
• Client restriction enforcement testing
• Edge case scenarios
• Performance testing with large restriction sets

──────────────────────────────────────────

Documentation (Total: 12-16 hours)

1.  Technical Documentation

Estimated: 6-8 hours

• API documentation for new endpoints
• Database schema documentation
• Package type schema reference guide
• Migration guide for existing installations

2.  User Documentation

Estimated: 6-8 hours

• Studio user guide: Creating dynamic packages
• Package type selection guide
• Client-facing restrictions explanation
• FAQ for common restriction scenarios

──────────────────────────────────────────

Total Effort Summary

Category │ Hours (Low) │ Hours (High) │ Percentage
------------------+-------------+--------------+-----------
**Database** │ 8 │ 12 │ 4%
**Backend** │ 60 │ 80 │ 35%
**Frontend** │ 70 │ 90 │ 42%
**Testing** │ 30 │ 40 │ 15%
**Documentation** │ 12 │ 16 │ 6%
**TOTAL** │ **180** │ **238** │ **100%**

──────────────────────────────────────────

Breakdown by Phase

Phase 1: Foundation (30-40 hours)
• Database migrations and seeds
• Package types API endpoints
• Basic package type manager UI

Phase 2: Dynamic Forms (40-52 hours)
• Dynamic form builder components
• Field rendering logic
• Package type schemas
• Updated services page

Phase 3: Restriction Backend (30-40 hours)
• Enforcement middleware
• Photo selection API updates
• Background jobs for lifecycle
• Package snapshot on project creation

Phase 4: Client Enforcement UI (24-30 hours)
• Selection counter widget
• Gallery page updates
• Lightbox restrictions
• Error handling and toasts

Phase 5: Analytics & Polish (26-36 hours)
• Usage tracking
• Analytics dashboard
• Project details panels
• Testing and documentation

Phase 6: Integration & Launch (30-40 hours)
• End-to-end testing
• User acceptance testing
• Documentation completion
• Bug fixes and refinements

──────────────────────────────────────────

Critical Path Items

1.  Database schema changes → Blocks all other work
2.  Package types API → Required for frontend work
3.  Dynamic form builder → Core UI feature
4.  Restriction middleware → Enables enforcement
5.  Selection counter UI → Core client feature

──────────────────────────────────────────

Risk Factors & Complexity

High Complexity Areas (May take 20-30% longer):
• Dynamic form builder with conditional fields
• Background jobs for archival/retention
• Restriction enforcement across multiple endpoints
• Migration of existing data without disruption

Medium Complexity:
• Package type CRUD operations
• Client-side selection tracking
• Usage stats calculation

Low Complexity:
• UI components for displaying restrictions
• Service layer updates
• Basic validation logic

──────────────────────────────────────────

Resource Requirements

Backend Developer:
• Total: 90-120 hours (2.5-3 months at 50% allocation)
• Skills needed: FastAPI, SQLAlchemy, PostgreSQL, background jobs

Frontend Developer:
• Total: 70-90 hours (2-2.5 months at 50% allocation)
• Skills needed: React, TypeScript, dynamic form rendering, state management

Full-Stack Developer (if solo):
• Total: 180-238 hours (4-6 months at 50% allocation)
• Can optimize by reusing patterns across backend/frontend

QA/Testing:
• Total: 30-40 hours (distributed across phases)

──────────────────────────────────────────

Recommended Timeline

Conservative Estimate (with buffer):
• 6-8 months with 1 developer at 50% allocation
• 3-4 months with 2 developers (1 backend, 1 frontend)
• 2-3 months with 2 full-time developers

Aggressive Estimate (tight schedule):
• 4-5 months with 1 developer at 75% allocation
• 2-3 months with 2 developers at 75% allocation
• 1.5-2 months with team of 3-4 developers

──────────────────────────────────────────

File Change Summary

New Files to Create:

Backend: 7 files
• app/routers/package_types.py
• app/middleware/package_restrictions.py
• app/schemas/package_types.py
• app/jobs/package_lifecycle.py
• app/jobs/usage_tracking.py
• app/integrations/whatsapp.py
• Migration file: 007_package_types_and_restrictions.sql

Frontend: 15 files
• components/studio/packageTypes/ (3 components)
• components/studio/services/ (5 new components)
• components/client/SelectionLimitWidget.tsx
• components/studio/projects/PackageUsagePanel.tsx
• services/packageTypeService.ts
• lib/packageHelpers.ts
• types/packageTypes.ts
• 2 additional utility files

Files to Modify:

Backend: 6 files
• app/routers/service_packages.py
• app/routers/photos.py
• app/routers/projects.py
• app/schemas/invoice.py
• app/db/models/service.py
• app/db/models/project.py

Frontend: 8 files
• components/studio/services/ServicesPage.tsx
• components/GalleryPage.tsx
• components/Lightbox.tsx
• components/studio/upload/Step1_ProjectSetup.tsx
• components/studio/upload/UploadContext.tsx
• components/studio/ClientDetailsPage.tsx
• services/servicePackageService.ts
• types.ts

Total: 22 new files, 14 files to modify

──────────────────────────────────────────

This breakdown provides a realistic estimate for implementing the complete package restriction system with all enforcement mechanisms and lifecycle management
features.
