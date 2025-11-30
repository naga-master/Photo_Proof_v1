# Billing Data Security - Payment Credentials Protection

**Document Version:** 1.0  
**Date:** November 30, 2024  
**Status:** Implementation Pending

---

## 1. Critical Finding

### Sensitive Payment Data in Browser localStorage

The application currently stores **highly sensitive financial data** in browser localStorage:

```typescript
// components/studio/SettingsPage.tsx - Line 47
localStorage.setItem('billingConfig', JSON.stringify(billingConfig));
```

### Data Structure Exposed

```typescript
// types.ts - BillingConfiguration interface
interface BillingConfiguration {
  tax: {
    enableGST: boolean;
    gstPercentage: number;
    gstNumber?: string;              // ⚠️ TAX IDENTIFICATION NUMBER
    enableAdditionalTax: boolean;
    additionalTaxName?: string;
    additionalTaxPercentage?: number;
  };
  paymentMethods: [{
    method: 'bank_transfer' | 'upi' | 'card' | 'cash' | 'cheque' | 'wallet';
    enabled: boolean;
    displayName: string;
    config?: {
      // BANK TRANSFER - CRITICAL DATA
      bankName?: string;
      accountNumber?: string;         // ⚠️ BANK ACCOUNT NUMBER
      ifscCode?: string;              // ⚠️ BANK ROUTING CODE
      accountHolderName?: string;
      
      // UPI - SENSITIVE
      upiId?: string;                 // ⚠️ UPI ID (can receive payments)
      qrCodeUrl?: string;
      
      // CARD/PAYMENT GATEWAY - CRITICAL
      merchantId?: string;            // ⚠️ MERCHANT CREDENTIALS
      apiKey?: string;                // ⚠️ PAYMENT GATEWAY API KEY
      gatewayName?: string;
      
      // WALLET
      walletProvider?: string;
      walletNumber?: string;          // ⚠️ WALLET ID
    };
  }];
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  invoiceNumbering: 'auto' | 'manual';
  paymentTermsDays: number;
  latePaymentFeePercentage?: number;
  enablePartialPayments: boolean;
}
```

---

## 2. Risk Assessment

### What's Exposed in Browser DevTools

Anyone who:
- Has physical access to the computer
- Installs a malicious browser extension
- Exploits an XSS vulnerability

Can view:

```
┌─────────────────────────────────────────────────────────────────┐
│  DevTools > Application > Local Storage > billingConfig         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  {                                                               │
│    "tax": {                                                      │
│      "gstNumber": "22AAAAA0000A1Z5"      ← Tax ID exposed       │
│    },                                                            │
│    "paymentMethods": [                                           │
│      {                                                           │
│        "method": "bank_transfer",                                │
│        "config": {                                               │
│          "bankName": "HDFC Bank",                                │
│          "accountNumber": "50100123456789", ← Bank account!      │
│          "ifscCode": "HDFC0001234",         ← Routing code!      │
│          "accountHolderName": "Studio Name"                      │
│        }                                                         │
│      },                                                          │
│      {                                                           │
│        "method": "upi",                                          │
│        "config": {                                               │
│          "upiId": "mystudio@okaxis"         ← UPI ID exposed     │
│        }                                                         │
│      },                                                          │
│      {                                                           │
│        "method": "card",                                         │
│        "config": {                                               │
│          "merchantId": "MID123456789",      ← Merchant ID!       │
│          "apiKey": "sk_live_abc123xyz..."   ← API KEY EXPOSED!   │
│        }                                                         │
│      }                                                           │
│    ]                                                             │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Impact Analysis

| Data Type | Risk Level | Potential Impact |
|-----------|------------|------------------|
| Payment Gateway API Key | **CRITICAL** | Attacker can process fraudulent transactions |
| Bank Account Number | **HIGH** | Identity theft, social engineering attacks |
| IFSC Code + Account | **HIGH** | Combined data enables bank fraud |
| Merchant ID | **HIGH** | Can be used to impersonate business |
| UPI ID | **MEDIUM** | Spam/phishing attacks to the ID |
| GST Number | **MEDIUM** | Business identity exposure |

---

## 3. Files Affected

### Files Writing billingConfig to localStorage

| File | Line | Action |
|------|------|--------|
| `components/studio/SettingsPage.tsx` | 47 | `localStorage.setItem('billingConfig', ...)` |

### Files Reading billingConfig from localStorage

| File | Line | Usage |
|------|------|-------|
| `components/studio/StudioLayout.tsx` | ~180 | `localStorage.getItem('billingConfig')` |
| `components/studio/StudioLayout.tsx` | ~220 | Same (duplicate read) |
| `components/studio/InvoicesPage.tsx` | ~35 | `localStorage.getItem('billingConfig')` |

---

## 4. Solution: Backend API Storage

### New API Endpoints Required

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW API ENDPOINTS                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET  /api/studio/billing-config                                 │
│       → Returns billing configuration for authenticated studio   │
│       → Requires studio_owner role                               │
│                                                                  │
│  PUT  /api/studio/billing-config                                 │
│       → Updates billing configuration                            │
│       → Validates input data                                     │
│       → Encrypts sensitive fields before storage                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Model

```python
# app/db/models/studio.py - NEW MODEL

class StudioBillingConfig(Base):
    __tablename__ = "studio_billing_configs"
    
    id = Column(Integer, primary_key=True)
    studio_id = Column(String, ForeignKey("studios.id"), unique=True)
    
    # Tax Configuration
    enable_gst = Column(Boolean, default=True)
    gst_percentage = Column(Float, default=18.0)
    gst_number = Column(String(20), nullable=True)  # Encrypted at rest
    enable_additional_tax = Column(Boolean, default=False)
    additional_tax_name = Column(String(50), nullable=True)
    additional_tax_percentage = Column(Float, nullable=True)
    
    # Payment Methods (JSON - sensitive fields encrypted)
    payment_methods = Column(JSON, nullable=False, default=list)
    
    # General Settings
    currency = Column(String(3), default="INR")
    currency_symbol = Column(String(5), default="₹")
    invoice_prefix = Column(String(10), default="INV")
    invoice_numbering = Column(String(10), default="auto")
    payment_terms_days = Column(Integer, default=15)
    late_payment_fee_percentage = Column(Float, nullable=True)
    enable_partial_payments = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationship
    studio = relationship("Studio", back_populates="billing_config")
```

### Backend Router

```python
# app/routers/studio.py - NEW ENDPOINTS

from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user, require_studio_owner
from app.schemas.studio import BillingConfigRead, BillingConfigUpdate

router = APIRouter(prefix="/api/studio", tags=["Studio"])

@router.get("/billing-config", response_model=BillingConfigRead)
def get_billing_config(
    current_user: UserRead = Depends(require_studio_owner),
    db: Session = Depends(get_db)
):
    """
    Get billing configuration for the authenticated studio.
    Sensitive fields (API keys, account numbers) are masked in response.
    """
    config = db.query(StudioBillingConfig).filter(
        StudioBillingConfig.studio_id == current_user.studio_id
    ).first()
    
    if not config:
        # Return default config if none exists
        return BillingConfigRead.default()
    
    return BillingConfigRead.from_orm(config)


@router.put("/billing-config", response_model=BillingConfigRead)
def update_billing_config(
    config_data: BillingConfigUpdate,
    current_user: UserRead = Depends(require_studio_owner),
    db: Session = Depends(get_db)
):
    """
    Update billing configuration.
    Sensitive fields are encrypted before storage.
    """
    config = db.query(StudioBillingConfig).filter(
        StudioBillingConfig.studio_id == current_user.studio_id
    ).first()
    
    if not config:
        config = StudioBillingConfig(studio_id=current_user.studio_id)
        db.add(config)
    
    # Update fields (encrypt sensitive data)
    for field, value in config_data.dict(exclude_unset=True).items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    
    return BillingConfigRead.from_orm(config)
```

---

## 5. Frontend Changes

### SettingsPage.tsx - Save to API

**Current (Insecure):**
```typescript
const handleSave = () => {
    // ... other saves ...
    
    // Save billing configuration (would integrate with backend in production)
    console.log('Billing Configuration:', billingConfig);
    localStorage.setItem('billingConfig', JSON.stringify(billingConfig));
    
    alert('Settings saved successfully!');
};
```

**Target (Secure):**
```typescript
const handleSave = async () => {
    try {
        // ... other saves ...
        
        // Save billing configuration to backend API
        await apiClient.put('/api/studio/billing-config', billingConfig);
        
        alert('Settings saved successfully!');
    } catch (error) {
        console.error('Failed to save billing config:', error);
        alert('Failed to save settings. Please try again.');
    }
};

// Load billing config from API on component mount
useEffect(() => {
    const loadBillingConfig = async () => {
        try {
            const config = await apiClient.get('/api/studio/billing-config');
            setBillingConfig(config);
        } catch (error) {
            console.error('Failed to load billing config:', error);
        }
    };
    loadBillingConfig();
}, []);
```

### StudioLayout.tsx - Fetch from API

**Current (Insecure):**
```typescript
const handleCreateInvoice = (project: Album, client: Client) => {
    const pkg = project.packageId 
        ? packages.find(p => p.id === project.packageId) 
        : null;
    const billingConfig = JSON.parse(localStorage.getItem('billingConfig') || '{}');
    setInvoiceInitialData({client, project, package: pkg, billingConfig});
    setView('invoiceEditor');
};
```

**Target (Secure):**
```typescript
const handleCreateInvoice = async (project: Album, client: Client) => {
    const pkg = project.packageId 
        ? packages.find(p => p.id === project.packageId) 
        : null;
    
    try {
        // Fetch billing config from API
        const billingConfig = await apiClient.get('/api/studio/billing-config');
        setInvoiceInitialData({client, project, package: pkg, billingConfig});
        setView('invoiceEditor');
    } catch (error) {
        console.error('Failed to load billing config:', error);
        // Proceed with default config or show error
        setInvoiceInitialData({client, project, package: pkg, billingConfig: {}});
        setView('invoiceEditor');
    }
};
```

### InvoicesPage.tsx - Remove localStorage Fallback

**Current (Insecure):**
```typescript
useEffect(() => {
    if (initialData?.billingConfig) {
        setBillingConfig(initialData.billingConfig);
    } else {
        const savedConfig = localStorage.getItem('billingConfig');
        if (savedConfig) {
            try {
                setBillingConfig(JSON.parse(savedConfig));
            } catch (e) {
                console.error('Failed to parse billing config:', e);
            }
        }
    }
}, [initialData?.billingConfig]);
```

**Target (Secure):**
```typescript
useEffect(() => {
    if (initialData?.billingConfig) {
        setBillingConfig(initialData.billingConfig);
    }
    // No localStorage fallback - billing config must come from API
}, [initialData?.billingConfig]);
```

---

## 6. Data Flow Comparison

### Current Flow (Insecure)

```
┌──────────────────┐     localStorage      ┌──────────────────┐
│  SettingsPage    │ ─────────────────────>│  Browser Storage │
│  (saves config)  │    billingConfig      │  (PLAIN TEXT)    │
└──────────────────┘                       └────────┬─────────┘
                                                    │
                    ┌───────────────────────────────┤
                    │                               │
                    ▼                               ▼
            ┌──────────────────┐           ┌──────────────────┐
            │  StudioLayout    │           │  InvoicesPage    │
            │  (reads config)  │           │  (reads config)  │
            └──────────────────┘           └──────────────────┘

⚠️ PROBLEM: Config stored in browser, visible to anyone
```

### Target Flow (Secure)

```
┌──────────────────┐                       ┌──────────────────┐
│  SettingsPage    │ ─── PUT /api/... ────>│  Backend API     │
│  (saves config)  │                       │                  │
└──────────────────┘                       └────────┬─────────┘
                                                    │
                                                    ▼
                                           ┌──────────────────┐
                                           │  Database        │
                                           │  (ENCRYPTED)     │
                                           └────────┬─────────┘
                                                    │
                    ┌───────────────────────────────┤
                    │  GET /api/...                 │  GET /api/...
                    ▼                               ▼
            ┌──────────────────┐           ┌──────────────────┐
            │  StudioLayout    │           │  InvoicesPage    │
            │  (fetches config)│           │  (receives props)│
            └──────────────────┘           └──────────────────┘

✅ SECURE: Config stored in database, fetched on demand
```

---

## 7. Security Best Practices for Payment Data

### API Response Masking

When returning billing config via API, mask sensitive fields:

```python
class BillingConfigRead(BaseModel):
    # ... other fields ...
    
    @validator('payment_methods', pre=True)
    def mask_sensitive_fields(cls, methods):
        for method in methods:
            if method.get('config'):
                config = method['config']
                # Mask account number: show last 4 digits only
                if config.get('accountNumber'):
                    config['accountNumber'] = '****' + config['accountNumber'][-4:]
                # Mask API keys completely
                if config.get('apiKey'):
                    config['apiKey'] = '****hidden****'
                # Mask UPI ID partially
                if config.get('upiId'):
                    parts = config['upiId'].split('@')
                    if len(parts) == 2:
                        config['upiId'] = parts[0][:3] + '***@' + parts[1]
        return methods
```

### Encryption at Storage

For cloud deployment, encrypt sensitive columns:

```python
from cryptography.fernet import Fernet

class EncryptedString(TypeDecorator):
    impl = Text
    
    def __init__(self, key: str):
        self.fernet = Fernet(key)
        super().__init__()
    
    def process_bind_param(self, value, dialect):
        if value:
            return self.fernet.encrypt(value.encode()).decode()
        return value
    
    def process_result_value(self, value, dialect):
        if value:
            return self.fernet.decrypt(value.encode()).decode()
        return value
```

---

## 8. Migration Checklist

- [ ] Create `StudioBillingConfig` database model
- [ ] Create database migration
- [ ] Implement `GET /api/studio/billing-config` endpoint
- [ ] Implement `PUT /api/studio/billing-config` endpoint
- [ ] Update `SettingsPage.tsx` to save via API
- [ ] Update `StudioLayout.tsx` to fetch via API
- [ ] Update `InvoicesPage.tsx` to remove localStorage fallback
- [ ] Add cleanup code to remove legacy `billingConfig` from localStorage
- [ ] Test all invoice generation flows
- [ ] Test settings save/load cycle

---

## Related Documents

- [01_SECURITY_OVERVIEW.md](./01_SECURITY_OVERVIEW.md) - Security overview
- [02_AUTHENTICATION_SECURITY.md](./02_AUTHENTICATION_SECURITY.md) - Auth token protection
- [05_IMPLEMENTATION_CHECKLIST.md](./05_IMPLEMENTATION_CHECKLIST.md) - Step-by-step guide
