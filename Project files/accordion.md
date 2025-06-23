## 📁 File: accordion.tsx

### 🔍 Purpose
Implements a custom accordion UI component using Radix UI and Tailwind CSS to allow expandable/collapsible content blocks.

### 🛠️ Technologies/Libraries Used
- React
- TypeScript
- @radix-ui/react-accordion (Radix UI primitive components)
- Tailwind CSS
- lucide-react (ChevronDown icon)
- Custom utility: `cn` (class name merger)

### 📤 Exports
- `Accordion`
- `AccordionItem`
- `AccordionTrigger`
- `AccordionContent`

### 🧠 Key Features
- Reusable and composable UI accordion system.
- Smooth transition animations when expanding/collapsing content.
- Chevron icon rotates on toggle using Tailwind data-state attributes.
- Utility `cn()` used to dynamically merge classNames.
- Built with `React.forwardRef` for enhanced ref forwarding and composability.

### 💡 Interview Points
- Use of `forwardRef` for building reusable component libraries.
- Understanding of controlled/uncontrolled components with Radix UI.
- Use of `data-[state=open]` Tailwind attribute selectors for animation.
- Clear separation of concerns between trigger, content, and container.

### 🏷️ Tags
`React`, `UI Component`, `Radix UI`, `Tailwind CSS`, `Accordion`, `Reusable Components`, `forwardRef`, `Lucide`, `Animations`, `Interview Ready`
