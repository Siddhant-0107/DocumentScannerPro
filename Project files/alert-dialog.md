## 📁 File: alert-dialog.tsx

### 🔍 Purpose
Creates a fully customizable alert dialog UI component using Radix UI and Tailwind CSS, designed for critical confirmations (e.g., delete actions), and integrated with reusable button variants.

### 🛠️ Technologies/Libraries Used
- React
- TypeScript
- @radix-ui/react-alert-dialog (Radix primitives)
- Tailwind CSS
- Custom utility: `cn` (conditional class merger)
- Shared button variants from `/components/ui/button`

### 📤 Exports
- `AlertDialog`
- `AlertDialogTrigger`
- `AlertDialogPortal`
- `AlertDialogOverlay`
- `AlertDialogContent`
- `AlertDialogHeader`
- `AlertDialogFooter`
- `AlertDialogTitle`
- `AlertDialogDescription`
- `AlertDialogAction`
- `AlertDialogCancel`

### 🧠 Key Features
- Declarative, accessible modal/dialog implementation using Radix's alert dialog primitives.
- Elegant overlay and content animations based on dialog state (open/close).
- Modular dialog structure: header, title, description, footer, actions, and cancel button.
- Tailwind-powered responsive design with slide/zoom transitions.
- Reusable and customizable buttons using shared `buttonVariants()`.
- Consistent `forwardRef` usage to support component composition and accessibility.

### 💡 Interview Points
- Benefits of Radix UI primitives for building accessible UI.
- How `forwardRef` supports composability in design systems.
- How utility functions like `cn` simplify conditional class logic.
- Animation via `data-[state=open]` and `data-[state=closed]` in Tailwind.
- Component decomposition for maintainability and reuse.

### 🏷️ Tags
`React`, `Radix UI`, `Alert Dialog`, `Tailwind CSS`, `UI Component`, `forwardRef`, `Animations`, `Reusable Design System`, `Modal`, `Accessibility`
