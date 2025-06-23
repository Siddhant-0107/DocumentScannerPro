## 📁 `alert.tsx`

### 📌 Purpose

This file defines a customizable `Alert` UI component using **React**, **class-variance-authority (CVA)**, and **Tailwind CSS**. It standardizes alert boxes across the app for displaying notifications, warnings, or errors.

### 🚀 Technologies Used

* **React**
* **TypeScript**
* **class-variance-authority (CVA)** for variant-based styling
* **Tailwind CSS utility classes**
* `cn` utility for merging class names

---

### 🧩 Exports

* `Alert`: The main wrapper for the alert box (`<div role="alert">`)
* `AlertTitle`: A styled title/headline for the alert
* `AlertDescription`: A paragraph-style description under the title

---

### 🧠 Key Features

* Uses `React.forwardRef` for better accessibility and compatibility
* Style variants:

  * `default`: standard alert
  * `destructive`: red-styled for error/destructive messages
* Leverages utility classes like:

  ```css
  [&>svg~*]:pl-7
  [&>svg+div]:translate-y-[-3px]
  ```

---

### 🎯 Interview Talking Points

* Importance of `forwardRef` in reusable components
* How `cva()` manages styling variations with Tailwind CSS
* Benefits of atomic CSS (Tailwind) + class merging via `cn()`
* Accessibility via `role="alert"`
* Clean separation of `Title` and `Description` for composition

---

### 🏷️ Tags

`#React` `#UIComponent` `#TailwindCSS` `#CVA` `#forwardRef` `#alert` `#AtomicDesign` `#TypeScript`
