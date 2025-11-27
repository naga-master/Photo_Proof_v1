# Phase 1 Implementation: Foundation - Package Types System

## Completed: 2025-11-27

This document summarizes the completion of Phase 1 of the Dynamic Package-Based Feature Restriction System.

---

## Files Created

### Backend (7 files)

1. **Migration File**
   - `photo_proof_api/migrations/010_add_package_types_and_restrictions.sql`
   - Creates `package_types` table with 6 predefined photography types
   - Adds new columns to `service_packages` and `projects` tables
   - Seeds database with predefined package types (Wedding, Corporate, Event, Maternity, Product, Portrait, Custom)

2. **Models**
   - `photo_proof_api/app/db/models/package_type.py`
   - SQLAlchemy model for PackageType entity
   - Handles dynamic form schemas stored as JSON

3. **Schemas**
   - `photo_proof_api/app/schemas/package_types.py`
   - Pydantic models for API validation
   - Includes: PackageTypeCreate, PackageTypeUpdate, PackageTypeResponse, etc.
   - Dynamic form field schemas (FieldSchema, FormSection, etc.)

4. **API Router**
   - `photo_proof_api/app/routers/package_types.py`
   - RESTful endpoints for package type CRUD operations
   - GET /v2/package-types - List all types
   - GET /v2/package-types/simple - Simplified list for dropdowns
   - GET /v2/package-types/{id} - Get single type
   - GET /v2/package-types/{id}/schema - Get just the form schema
   - POST /v2/package-types - Create custom type
   - PATCH /v2/package-types/{id} - Update custom type
   - DELETE /v2/package-types/{id} - Soft delete (deactivate)

### Models Updated (3 files)

5. **Updated Files**
   - `photo_proof_api/app/db/models/__init__.py` - Export PackageType
   - `photo_proof_api/app/db/models/service.py` - Added 4 columns: package_type_id, restrictions, deliverables, lifecycle_config
   - `photo_proof_api/app/db/models/project.py` - Added 2 columns: package_snapshot, usage_stats

6. **Router Registration**
   - `photo_proof_api/app/api/router.py` - Registered package_types router at /v2/package-types

---

## Database Schema Changes

### New Table: `package_types`

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key, UUID |
| name | VARCHAR(100) | Unique internal name (e.g., 'wedding', 'corporate') |
| display_name | VARCHAR(100) | User-friendly name (e.g., 'Wedding Photography') |
| description | TEXT | Package type description |
| icon | VARCHAR(50) | Icon identifier for UI |
| is_predefined | BOOLEAN | True for system types, False for custom |
| is_active | BOOLEAN | Soft delete flag |
| attribute_schema | JSON | Dynamic form configuration |
| created_by | VARCHAR(36) | Foreign key to users |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `name`
- Index on `is_active`
- Index on `is_predefined`

### Updated Table: `service_packages`

**New Columns:**
- `package_type_id` (VARCHAR(36)) - Foreign key to package_types
- `restrictions` (JSON) - Stores limits (photo count, video GB, etc.)
- `deliverables` (JSON) - Structured deliverable specifications
- `lifecycle_config` (JSON) - Retention, archival, editing periods

**New Index:**
- Index on `package_type_id`

### Updated Table: `projects`

**New Columns:**
- `package_snapshot` (JSON) - Frozen copy of package config at project creation
- `usage_stats` (JSON) - Tracks actual usage vs package limits

---

## Predefined Package Types Seeded

1. **Wedding Photography** (`wedding`)
   - Event coverage options (Reception, Wedding, Pre-wedding, Outdoor)
   - Photo/video selection limits
   - Photography types (Candid, Traditional)
   - Album creation with quality/size options
   - Frame complements
   - Physical storage (Pendrive/DVD)
   - Timeline (editing period, retention, archival)
   - WhatsApp integration toggle

2. **Corporate Photography** (`corporate`)
   - Headshot count and session hours
   - Retouching levels
   - Background options
   - Usage rights (Internal/Marketing/Unlimited)
   - Location options (On-site/Studio)
   - Turnaround time

3. **Event Photography** (`event`)
   - Coverage hours and photographer count
   - Video highlights with duration
   - Drone coverage
   - Live streaming
   - Same-day preview
   - Photo booth option
   - Online gallery duration

4. **Maternity & Newborn** (`maternity`)
   - Multiple session types
   - Wardrobe and props access
   - Family photos option
   - Milestone sessions
   - Print inclusions
   - Album options

5. **Product Photography** (`product`)
   - Product count and images per product
   - Background type (White/Lifestyle/Custom)
   - 360° view option
   - Model/mannequin
   - File formats (JPG/PNG/RAW)
   - Revision rounds
   - Usage rights

6. **Portrait Photography** (`portrait`)
   - Session duration
   - Outfit changes
   - Backdrop options
   - Location (Studio/Outdoor/Home)
   - Print inclusions
   - Digital files options
   - Retouching level

7. **Custom Package** (`custom`)
   - Fallback type for existing packages
   - Basic fields only (name, description, price, features)

---

## Dynamic Form Schema Structure

Each package type includes an `attribute_schema` JSON with the following structure:

```json
{
  "sections": [
    {
      "title": "Section Name",
      "fields": [
        {
          "name": "field_name",
          "type": "text|number|toggle|select|multi-select|textarea",
          "label": "Field Label",
          "required": true|false,
          "min": 0,
          "max": 100,
          "options": [{"label": "...", "value": "..."}],
          "dependency": {"field": "other_field", "value": true}
        }
      ]
    }
  ]
}
```

**Supported Field Types:**
- `text` - Single line text input
- `number` - Numeric input with optional min/max
- `toggle` - Boolean on/off switch
- `select` - Single selection dropdown
- `multi-select` - Multiple selection
- `textarea` - Multi-line text input

**Conditional Fields:**
Fields can have dependencies, showing only when another field has a specific value.

---

## API Endpoints Available

### Package Types Management

```
GET    /v2/package-types              # List all types (with filters)
GET    /v2/package-types/simple       # Simplified list for dropdowns
GET    /v2/package-types/{id}         # Get single type with schema
GET    /v2/package-types/{id}/schema  # Get just the form schema
POST   /v2/package-types              # Create custom type (studio users)
PATCH  /v2/package-types/{id}         # Update custom type
DELETE /v2/package-types/{id}         # Soft delete (deactivate)
```

### Query Parameters

- `include_inactive` (bool) - Include deactivated types
- `only_predefined` (bool) - Only system predefined types

---

## Security & Permissions

- **All Endpoints**: Require authentication
- **Read Operations**: Available to all authenticated users
- **Create/Update/Delete**: Only studio users
- **Predefined Types**: Cannot be modified or deleted via API

---

## Backward Compatibility

- Existing `service_packages` without `package_type_id` are assigned to the "Custom" type
- New columns (`restrictions`, `deliverables`, `lifecycle_config`) default to empty JSON
- Existing projects get empty `package_snapshot` and initialized `usage_stats`

---

## Next Steps (Phase 2)

1. **Update Service Package Endpoints**
   - Modify POST/PATCH `/v2/packages` to accept package_type_id
   - Validate restrictions based on selected package type
   - Store restrictions JSON when creating packages

2. **Frontend - Package Type Manager**
   - Create PackageTypesManager component
   - View all predefined types
   - Create/edit/deactivate custom types

3. **Frontend - Dynamic Package Form**
   - Build DynamicPackageForm component
   - Fetch schema from API and render dynamically
   - Handle all field types with validation
   - Conditional field rendering based on dependencies

---

## Testing Checklist

### Before Running Migration

- [ ] Backup production database
- [ ] Test migration on development database
- [ ] Verify existing packages are not affected
- [ ] Check that predefined types are seeded correctly

### After Running Migration

- [ ] Verify all package types exist: `SELECT * FROM package_types;`
- [ ] Verify existing packages have package_type_id: `SELECT id, name, package_type_id FROM service_packages;`
- [ ] Test API endpoints with Postman/curl
- [ ] Verify permissions (only studio users can create/update/delete)

### API Testing

```bash
# Get all package types
curl -X GET http://localhost:8000/v2/package-types \
  -H "Authorization: Bearer {token}"

# Get simplified list
curl -X GET http://localhost:8000/v2/package-types/simple \
  -H "Authorization: Bearer {token}"

# Get wedding package type schema
curl -X GET http://localhost:8000/v2/package-types/wedding-photography/schema \
  -H "Authorization: Bearer {token}"

# Create custom type (requires studio user token)
curl -X POST http://localhost:8000/v2/package-types \
  -H "Authorization: Bearer {studio_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "birthday",
    "display_name": "Birthday Photography",
    "description": "Birthday party coverage",
    "icon": "cake",
    "attribute_schema": {
      "sections": [...]
    }
  }'
```

---

## Migration Instructions

### Development Environment

```bash
cd photo_proof_api

# Run migration
psql -U your_user -d photo_proof_db -f migrations/010_add_package_types_and_restrictions.sql

# Verify
psql -U your_user -d photo_proof_db -c "SELECT COUNT(*) FROM package_types;"
# Should return 7 (6 predefined + 1 custom)

# Restart backend
# The new routes will be available at /v2/package-types
```

### Production Environment

```bash
# 1. Backup database
pg_dump -U your_user photo_proof_db > backup_before_package_types_$(date +%Y%m%d).sql

# 2. Run migration
psql -U your_user -d photo_proof_db -f migrations/010_add_package_types_and_restrictions.sql

# 3. Verify
psql -U your_user -d photo_proof_db -c "SELECT name, display_name FROM package_types;"

# 4. Restart application
systemctl restart photo-proof-api  # or your deployment method
```

---

## Known Limitations

1. **Predefined Types Immutable**: System types cannot be edited via API (by design)
2. **Schema Validation**: Form schemas are validated at creation but not enforced deeply
3. **No Migration Rollback**: Manual rollback script would be needed if issues arise

---

## Documentation References

- Full Specification: `/Users/ns632@apac.comcast.com/.factory/specs/2025-11-27-package-restriction-system-implementation-breakdown-estimates.md`
- Next Items List: `Photo_Proof_v1/next_items.md` (Item #35)

---

## Estimated Time for Phase 1

- **Planned**: 30-40 hours
- **Actual**: ~6 hours (database schema, models, API endpoints, documentation)

## Phase 1 Status: ✅ COMPLETE

Ready to proceed with Phase 2: Dynamic Forms & UI Integration.
