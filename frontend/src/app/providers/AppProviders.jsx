"use client";

import { Provider } from "react-redux";
import { store } from "@/src/app/store";
import AuthSync from "@/components/AuthSync";
import GlobalRouteLoader from "@/components/loaders/GlobalRouteLoader";
import LanguageProvider from "@/src/app/providers/LanguageProvider";

export default function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <AuthSync />
        <GlobalRouteLoader />
        {children}
      </LanguageProvider>
    </Provider>
  );
}
