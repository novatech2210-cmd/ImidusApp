# Component Usage Examples

Quick reference for using the built components in your admin portal.

## Navigation Layout

### Basic Page with Layout
```tsx
import MainLayout from '@/components/Navigation/MainLayout';

export default function SamplePage() {
  return (
    <MainLayout userName="John Admin" userEmail="admin@ini.com">
      <div className="p-6">
        {/* Your page content here */}
      </div>
    </MainLayout>
  );
}
```

---

## Data Table

### Basic Table Usage
```tsx
import DataTable, { Column } from '@/components/Tables/DataTable';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => (
      <span className={value === 'active' ? 'text-green-600' : 'text-red-600'}>
        {value}
      </span>
    ),
  },
];

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);

  return (
    <DataTable<User>
      columns={columns}
      data={users}
      pageSize={10}
      onRowClick={(user) => console.log(user)}
    />
  );
}
```

---

## Form Builder

### Contact Form Example
```tsx
import { useState } from 'react';
import FormBuilder, { FormField } from '@/components/Forms/FormBuilder';

export default function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'John Doe',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'john@example.com',
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
      placeholder: 'Your message here...',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Submit to API
      console.log('Submitting:', values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormBuilder
      fields={fields}
      values={values}
      errors={errors}
      onChange={(name, value) => setValues(prev => ({ ...prev, [name]: value }))}
      onSubmit={handleSubmit}
      submitLabel="Send Message"
      isLoading={loading}
    />
  );
}
```

---

## Modal Dialog

### Modal with Form
```tsx
import { useState } from 'react';
import Modal from '@/components/Dialogs/Modal';

export default function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Create User
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New User"
        size="md"
      >
        <div className="space-y-4">
          {/* Form content */}
        </div>
      </Modal>
    </>
  );
}
```

### Modal with Footer
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={
    <div className="flex gap-2">
      <button onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 border rounded">
        Cancel
      </button>
      <button onClick={handleConfirm} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded">
        Confirm
      </button>
    </div>
  }
>
  Are you sure you want to proceed?
</Modal>
```

---

## Loading States

### Skeleton Loader
```tsx
import { SkeletonTable, SkeletonCard, SkeletonText } from '@/components/Loading/Skeleton';

export default function LoadingExample() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonText count={2} />
        <SkeletonCard />
        <SkeletonTable rows={5} cols={3} />
      </div>
    );
  }

  return <div>Content loaded!</div>;
}
```

### Spinner
```tsx
import Spinner, { LoadingOverlay, InlineSpinner } from '@/components/Loading/Spinner';

// Full screen
<Spinner fullScreen size="md" text="Loading..." />

// Inline
<InlineSpinner size="sm" />

// Overlay
<div className="relative h-64">
  <LoadingOverlay />
  Content behind overlay
</div>
```

---

## Dashboard

### Using Dashboard Summary
```tsx
import DashboardSummary from '@/app/protected/dashboard/DashboardSummary';
import { useDashboardSummary } from '@/lib/hooks';

export default function Dashboard() {
  const { data, isPending } = useDashboardSummary('2026-01-01', '2026-03-07');

  return (
    <DashboardSummary
      data={data}
      loading={isPending}
    />
  );
}
```

---

## Orders Management

### Order Detail Modal
```tsx
import OrderDetailModal from '@/components/Orders/OrderDetailModal';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <>
      <OrderDetailModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </>
  );
}
```

### Refund Dialog
```tsx
import RefundDialog from '@/components/Orders/RefundDialog';

<RefundDialog
  isOpen={showRefund}
  onClose={() => setShowRefund(false)}
  orderId={order.id}
  orderTotal={order.total}
  onSuccess={() => {
    setShowRefund(false);
    refetchOrders();
  }}
/>
```

---

## Customers

### Customer List with Profile
```tsx
import CustomerList from '@/components/Customers/CustomerList';
import CustomerProfile from '@/components/Customers/CustomerProfile';
import { useCustomerList, useCustomerProfile } from '@/lib/hooks';

export default function CustomersPage() {
  const [selectedId, setSelectedId] = useState(null);
  const { data: customers } = useCustomerList();
  const { data: profile } = useCustomerProfile(selectedId || 0);

  return (
    <>
      <CustomerList
        customers={customers}
        onCustomerClick={(customer) => setSelectedId(customer.id)}
      />
      <CustomerProfile
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        profile={profile}
      />
    </>
  );
}
```

---

## Campaigns

### Campaign Builder Multi-Step Form
```tsx
import CampaignBuilder from '@/components/Campaigns/CampaignBuilder';

export default function CampaignsPage() {
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <>
      <button onClick={() => setShowBuilder(true)}>
        Create Campaign
      </button>
      
      <CampaignBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSuccess={() => {
          setShowBuilder(false);
          // Refetch campaigns
        }}
      />
    </>
  );
}
```

---

## Common Patterns

### With React Query
```tsx
import { useDashboardSummary } from '@/lib/hooks';

export default function Dashboard() {
  const { data, isPending, error, refetch } = useDashboardSummary('2026-01-01', '2026-03-07');

  if (error) {
    return <div className="text-red-600">Failed to load data</div>;
  }

  return (
    <>
      <DashboardSummary data={data} loading={isPending} />
      <button onClick={() => refetch()}>Refresh</button>
    </>
  );
}
```

### Error Handling
```tsx
const { mutate: createCampaign, isPending } = useCreateCampaign();

const handleCreate = () => {
  createCampaign(formData, {
    onSuccess: () => {
      // Success handling
      setShowBuilder(false);
      refetch();
    },
    onError: (error) => {
      // Error handling
      setError(error.message || 'Failed to create campaign');
    },
  });
};
```

### Filters and Search
```tsx
const [statusFilter, setStatusFilter] = useState('');
const [searchTerm, setSearchTerm] = useState('');

const { data: orders } = useOrderQueue(
  statusFilter || undefined,
  searchTerm || undefined
);

// In JSX:
<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
  <option value="">All</option>
  <option value="pending">Pending</option>
</select>

<input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search..."
/>
```

---

## Styling Reference

### Common Classes
```tsx
// Colors
bg-orange-500 // Primary action
bg-red-50 // Error background
bg-green-100 // Success background

// Sizing
p-6 // Padding
px-4 py-2 // Horizontal/vertical
w-full // Full width
h-screen // Full height

// Responsive
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
// 1 column on mobile, 2 on tablet, 3 on desktop

// States
hover:bg-gray-50
focus:ring-2 focus:ring-orange-500
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## Tips & Tricks

### Performance
- Use `useMemo` for expensive transformations
- Use `useCallback` for event handlers
- Pagination by default is 15 items per page
- Skeletons load faster than spinners

### Validation
- FormBuilder validates on submit by default
- Custom validation via `field.validation` function
- Errors display below each field

### Formatting
- Currency: `${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
- Date: `new Date(isoString).toLocaleDateString()`
- Time: `new Date(isoString).toLocaleTimeString()`

### Accessibility
- All forms have proper labels
- Buttons have proper types (button, submit, reset)
- Modals trap focus
- Error messages linked to fields

---

## Troubleshooting

### Types not working
```tsx
// Make sure to pass generic type to components
<DataTable<YourType> columns={cols} data={data} />

// Import types from component
import { Column } from '@/components/Tables/DataTable';
```

### Hooks error: "Cannot find module"
```tsx
// Check that @/lib/hooks.ts exists and has your hook
import { useCustomerList } from '@/lib/hooks';
```

### Modal backdrop not closing
```tsx
// Use closeOnBackdrop prop
<Modal isOpen={isOpen} closeOnBackdrop={true} onClose={onClose} />
```

---

**Last Updated:** 2026-03-07
