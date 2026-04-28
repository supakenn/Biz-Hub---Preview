# Biz Hub Shell Architecture & Templates

This directory (`src/shell/`) contains the global wrapper, routing logic, and standard UI templates for the Biz Hub ecosystem. 

By keeping global navigation and templates isolated here, individual modules (like the `POS` or `IMS`) remain completely decoupled. They can be lazy-loaded, updated, and tested completely independently from each other.

## Core Files
- `BizHubShell.jsx`: The master layout wrapper. It houses the sidebar and injects the routing context.
- `AppRouter.jsx`: A standard React Router configuration using `<Suspense>` to lazy-load apps.
- `HubDashboard.jsx`: The landing page where users can manage their modules and see global metrics.
- `components/GlobalSidebar.jsx`: The slide-in drawer used for navigating between installed modules.

---

## The Standardized UI Template (`BaseModal.jsx`)

To ensure a cohesive user experience across all modules, we use standard templates. The most important one is the `BaseModal` which ensures all popups share the exact same spacing, colors, and animations.

### How to Hook `BaseModal` into Other Apps

If you are building a new module (e.g. `src/apps/Inventory/`) or refactoring an existing one, do **not** write raw fixed `div`s with z-indexes for modals. 

Instead, import the template from the shell:

```jsx
import { useState } from 'react';
import { Settings } from 'lucide-react';
// Import the base template from the shell components
import BaseModal from '../../shell/components/BaseModal';

export default function MyCustomAppModule() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div>
      <button onClick={() => setShowSettings(true)}>Open Settings</button>

      {/* Implementing the Standard Modal Template */}
      <BaseModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        title="App Settings"
        icon={Settings}
        iconColor="text-yellow-400"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowSettings(false)} className="btn-secondary">Cancel</button>
            <button className="btn-primary">Save Changes</button>
          </div>
        }
      >
        {/* Your modal content goes here */}
        <p>This content is automatically scrollable if it exceeds the max-height!</p>
      </BaseModal>
    </div>
  );
}
```

### BaseModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | Required | Toggles the modal visibility |
| `onClose` | function | Required | Callback triggered when X is clicked or backdrop is clicked |
| `title` | string/node | Required | Text displayed in the header |
| `icon` | LucideIcon | null | Optional icon rendered next to the title |
| `iconColor` | string | `'text-blue-500'` | Tailwind text color class for the icon |
| `maxWidth` | string | `'max-w-md'` | Tailwind max width class (`max-w-sm`, `max-w-lg`, `max-w-2xl`, etc.) |
| `children` | node | Required | The body content of the modal (automatically scrolls) |
| `footer` | node | null | Content pinned to the bottom of the modal (great for action buttons) |
