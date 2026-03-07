"use client";

import { Provider } from "react-redux";
import { store } from "@/src/app/store";
import AuthSync from "@/components/AuthSync";
import GlobalRouteLoader from "@/components/loaders/GlobalRouteLoader";

export default function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <AuthSync />
      <GlobalRouteLoader />
      {children}
    </Provider>
  );
}

