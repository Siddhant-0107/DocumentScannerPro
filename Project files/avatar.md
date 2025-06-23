## 📁 `avatar.tsx`

### 📌 Purpose
Provides a reusable and accessible `Avatar` UI component using Radix UI primitives. It displays user profile images with graceful fallback support when an image fails to load.

---

### 🚀 Technologies Used
- **React**
- **TypeScript**
- **Radix UI (`@radix-ui/react-avatar`)**
- **Tailwind CSS**
- **Custom `cn()` utility for conditional className merging**

---

### 🧩 Exports
- `Avatar`: Main wrapper component that renders the avatar root
- `AvatarImage`: Displays the image inside the avatar
- `AvatarFallback`: Fallback element (usually initials or icon) when the image fails to load

---

### 🧠 Key Features
- Uses `React.forwardRef` for improved accessibility and integration
- Tailwind-based responsive design:  
  `h-10 w-10 rounded-full` ensures circular avatars
- Fallback gracefully displays initials or placeholder in case of image load failure
- Ensures aspect ratio and cropping using `aspect-square h-full w-full`
- Maintains consistent size and shape with `shrink-0 overflow-hidden`

---

### 🎯 Interview Talking Points
- Why `forwardRef` is used for third-party composability
- Handling avatar image load failure with fallbacks
- Role of Radix primitives for accessibility and semantic structure
- Performance and UI consistency with fallback + image patterns
- Styling avatars responsively with Tailwind’s utility-first approach

---

### 🏷️ Tags
`#React` `#Avatar` `#RadixUI` `#UIComponent` `#ResponsiveDesign` `#TailwindCSS` `#forwardRef` `#TypeScript`
