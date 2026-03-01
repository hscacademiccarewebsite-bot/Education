"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import AuthSync from "@/components/AuthSync";

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthSync />
      {children}
    </Provider>
  );
}
