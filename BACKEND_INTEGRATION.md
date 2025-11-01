# Photo Proof v1 - Backend Integration Guide

## ✅ Integration Complete!

Your **Photo_Proof_v1** frontend is now configured to connect with the FastAPI backend running on `http://localhost:8000`.

---

## 📁 What Was Added

### 1. Environment Configuration
**File**: `.env.local`
```bash
VITE_API_URL=http://localhost:8000
```

### 2. Vite Proxy Configuration
**File**: `vite.config.ts`
- Added proxy to forward `/api/*` requests to backend
- All API calls are automatically routed through `http://localhost:8000`

### 3. API Client Library
**File**: `lib/api-client.ts`
- Centralized HTTP client with authentication
- Automatic token management
- Error handling and 401 redirects
- Support for GET, POST, PUT, PATCH, DELETE, file uploads

### 4. Service Modules

All services are in the `services/` directory:

#### `authService.ts`
- `studioLogin(credentials)` - Studio user login
- `clientLogin(credentials)` - Client user login
- `studioRegister(data)` - Studio registration
- `getCurrentUser()` - Get authenticated user
- `logout()` - Clear auth data
- `isAuthenticated()` - Check auth status

#### `projectService.ts`
- `getProjects(studioId?, status?)` - List projects
- `getProject(projectId)` - Get single project
- `createProject(data)` - Create new project
- `updateProject(projectId, data)` - Update project
- `deleteProject(projectId)` - Delete project
- `generateAccessUrl(projectId)` - Create shareable URL

#### `photoService.ts`
- `getProjectPhotos(projectId, categoryId?)` - Get photos
- `getPhoto(photoId)` - Get single photo
- `uploadPhoto(data)` - Upload new photo
- `updatePhoto(photoId, data)` - Update metadata
- `deletePhoto(photoId)` - Delete photo
- `toggleFavorite(photoId)` - Toggle favorite
- `toggleSelection(photoId)` - Toggle selection
- `bulkUpdatePhotos(photoIds, updates)` - Bulk operations

#### `clientService.ts`
- `getClients(studioId?, search?)` - List clients
- `getClient(clientId)` - Get single client
- `createClient(data)` - Create client
- `updateClient(clientId, data)` - Update client
- `deleteClient(clientId)` - Delete client
- `archiveClient(clientId)` - Archive client
- `activateClient(clientId)` - Reactivate client

#### `productService.ts`
- `getProducts(productType?)` - List products
- `getProduct(productId)` - Get single product
- `createProduct(data)` - Create product
- `updateProduct(productId, data)` - Update product
- `deleteProduct(productId)` - Delete product

#### `cartService.ts`
- `getCart()` - Get current cart
- `addToCart(data)` - Add item
- `updateCartItem(itemId, data)` - Update quantity/options
- `removeFromCart(itemId)` - Remove item
- `clearCart()` - Empty cart
- `getCartSummary()` - Get totals

#### `orderService.ts`
- `getOrders(status?)` - List orders
- `getOrder(orderId)` - Get single order
- `createOrderFromCart(data)` - Checkout
- `updateOrder(orderId, data)` - Update order
- `cancelOrder(orderId)` - Cancel order
- `markOrderPaid(orderId, paymentMethod)` - Mark paid

#### `invoiceService.ts`
- `getInvoices(status?, clientId?)` - List invoices
- `getInvoice(invoiceId)` - Get single invoice
- `createInvoice(data)` - Create invoice
- `updateInvoice(invoiceId, data)` - Update invoice
- `deleteInvoice(invoiceId)` - Delete invoice
- `sendInvoice(invoiceId)` - Mark as sent
- `markInvoicePaid(invoiceId, paidDate?)` - Mark paid
- `generateInvoicePDF(invoiceId)` - Download PDF

---

## 🔄 How to Replace Mock Data

### Example 1: Replace Store Products

**Before** (using mock data):
```typescript
import { products } from '../data/products';

function StorePage() {
  const [items, setItems] = useState(products);
  // ...
}
```

**After** (using API):
```typescript
import { productService } from '../services/productService';

function StorePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productService.getProducts();
        setItems(response.products);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  // ...
}
```

### Example 2: Replace Client List

**Before**:
```typescript
import { clients } from '../data/clients';

function ClientsPage() {
  const [clientList, setClientList] = useState(clients);
  // ...
}
```

**After**:
```typescript
import { clientService } from '../services/clientService';

function ClientsPage() {
  const [clientList, setClientList] = useState([]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await clientService.getClients();
        setClientList(response.clients);
      } catch (error) {
        console.error('Failed to load clients:', error);
      }
    };
    
    loadClients();
  }, []);
  // ...
}
```

### Example 3: Create New Project

```typescript
import { projectService } from '../services/projectService';

async function handleCreateProject(formData) {
  try {
    const newProject = await projectService.createProject({
      name: formData.name,
      description: formData.description,
      client_name: formData.clientName,
      client_email: formData.clientEmail,
      watermark_enabled: true,
      comment_enabled: true,
    });
    
    console.log('Project created:', newProject.id);
    // Navigate or refresh list
  } catch (error) {
    console.error('Failed to create project:', error);
  }
}
```

### Example 4: Upload Photos

```typescript
import { photoService } from '../services/photoService';

async function handlePhotoUpload(file: File, projectId: string) {
  try {
    const photo = await photoService.uploadPhoto({
      project_id: projectId,
      file: file,
    });
    
    console.log('Photo uploaded:', photo.id);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Example 5: Login Flow

```typescript
import { authService } from '../services/authService';

async function handleLogin(email: string, password: string, isStudio: boolean) {
  try {
    const response = isStudio 
      ? await authService.studioLogin({ email, password })
      : await authService.clientLogin({ email, password });
    
    console.log('Logged in:', response.user);
    // Navigate to dashboard
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Check if logged in
if (authService.isAuthenticated()) {
  const user = authService.getStoredUser();
  console.log('Current user:', user);
}
```

---

## 🚀 Running the Full Stack

### Terminal 1: Start Backend
```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/photo_proof_api
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** `http://localhost:8000`
**API Docs:** `http://localhost:8000/docs`

### Terminal 2: Start Frontend
```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1
npm run dev
```

**Frontend will be available at:** `http://localhost:3001`

---

## 🔐 Demo Credentials

### Studio User
- **Email**: `studio@demo.com`
- **Password**: `demo123`

### Client User
- **Email**: `client@demo.com`
- **Password**: `demo123`

---

## 📊 API Endpoints Reference

All endpoints use the `/api/v2` prefix:

### Authentication
- `POST /api/v2/auth/studio/login`
- `POST /api/v2/auth/client/login`
- `POST /api/v2/auth/studio/register`
- `GET /api/v2/auth/me`

### Projects
- `GET /api/v2/projects`
- `POST /api/v2/projects`
- `GET /api/v2/projects/{id}`
- `PATCH /api/v2/projects/{id}`
- `DELETE /api/v2/projects/{id}`

### Photos
- `GET /api/v2/photos/project/{project_id}`
- `POST /api/v2/photos/upload`
- `GET /api/v2/photos/{id}`
- `PATCH /api/v2/photos/{id}`
- `DELETE /api/v2/photos/{id}`
- `POST /api/v2/photos/{id}/favorite`
- `POST /api/v2/photos/{id}/select`

### Clients
- `GET /api/v2/clients`
- `POST /api/v2/clients`
- `GET /api/v2/clients/{id}`
- `PATCH /api/v2/clients/{id}`
- `DELETE /api/v2/clients/{id}`

### Products
- `GET /api/v2/products`
- `POST /api/v2/products`
- `GET /api/v2/products/{id}`

### Cart
- `GET /api/v2/cart`
- `POST /api/v2/cart/items`
- `PATCH /api/v2/cart/items/{id}`
- `DELETE /api/v2/cart/items/{id}`

### Orders
- `GET /api/v2/orders`
- `POST /api/v2/orders/from-cart`
- `GET /api/v2/orders/{id}`
- `PATCH /api/v2/orders/{id}`

### Invoices
- `GET /api/v2/invoices`
- `POST /api/v2/invoices`
- `GET /api/v2/invoices/{id}`
- `PATCH /api/v2/invoices/{id}`
- `POST /api/v2/invoices/{id}/send`
- `POST /api/v2/invoices/{id}/pay`

---

## 🛠️ Components to Update

These components currently use mock data and should be updated:

1. **`components/StorePage.tsx`**
   - Replace `import { products }` with `productService.getProducts()`

2. **`components/studio/InvoicesPage.tsx`**
   - Replace `import { invoiceTemplates }` with `invoiceService.getInvoices()`

3. **`components/studio/NotificationsPage.tsx`**
   - Replace `import { mockNotifications }` with API notifications endpoint

4. **`components/studio/LayoutsPage.tsx`**
   - Replace `import { layoutTemplates }` with layouts API endpoint

5. **`components/studio/upload/Step1_ProjectSetup.tsx`**
   - Replace `import { layoutTemplates }` with layouts API

---

## ⚠️ Important Notes

1. **CORS**: The backend has CORS configured for `http://localhost:3001`

2. **Authentication**: 
   - Tokens are stored in `localStorage`
   - Token expires in 60 minutes
   - 401 responses automatically clear auth data

3. **Error Handling**: 
   - All API errors include `message`, `status`, and `detail`
   - Use try/catch blocks around service calls

4. **File Uploads**:
   - Use `photoService.uploadPhoto()` for images
   - Files are sent as `multipart/form-data`

5. **Mock Data Fallback**:
   - Keep mock data files during migration
   - Use them as fallback if API is unavailable

---

## 🧪 Testing the Integration

### Quick Test Script

Create `test-api.ts` in your project:

```typescript
import { authService } from './services/authService';
import { projectService } from './services/projectService';

async function testIntegration() {
  try {
    // Test login
    console.log('Testing login...');
    await authService.studioLogin({
      email: 'studio@demo.com',
      password: 'demo123',
    });
    console.log('✅ Login successful');

    // Test get projects
    console.log('Testing get projects...');
    const projects = await projectService.getProjects();
    console.log('✅ Projects:', projects.total);

    console.log('🎉 Integration working!');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

testIntegration();
```

---

## 📚 Next Steps

1. **Start both servers** (backend on 8000, frontend on 3001)
2. **Test login** with demo credentials
3. **Update components** one by one to use services
4. **Remove mock data imports** as you migrate
5. **Add loading states** and error handling
6. **Test all CRUD operations**

---

## 🐛 Troubleshooting

### "Network Error" or "Failed to Fetch"
- Check backend is running: `curl http://localhost:8000/health`
- Check Vite proxy is configured correctly
- Check browser console for CORS errors

### "401 Unauthorized"
- Token may be expired - try logging in again
- Check `localStorage` has `auth_token`

### "Connection Refused"
- Backend may not be running on port 8000
- Check `VITE_API_URL` in `.env.local`

### Mock Data Still Showing
- Hard refresh browser (Cmd+Shift+R)
- Check component is using service, not mock import
- Check service is called in `useEffect`

---

## 📝 Summary

✅ **Environment configured** with `.env.local`  
✅ **Vite proxy** routes `/api/*` to backend  
✅ **API client** handles auth and errors  
✅ **7 service modules** provide full API coverage  
✅ **Type-safe interfaces** for all requests/responses  
✅ **Ready to migrate** components from mock data  

**Your Photo_Proof_v1 is now fully integrated with the FastAPI backend!** 🚀
