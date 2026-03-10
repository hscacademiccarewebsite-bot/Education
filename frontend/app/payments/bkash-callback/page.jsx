"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useExecuteBkashPaymentMutation } from "@/lib/features/payment/paymentApi";
import { InlineLoader } from "@/components/loaders/AppLoader";
import PageHero from "@/components/layouts/PageHero";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

export default function BkashCallbackPage() {
  const { t } = useSiteLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paymentID = searchParams.get("paymentID");
  const status = searchParams.get("status");
  const merchantInvoiceNumber = searchParams.get("merchantInvoiceNumber");

  const [executeBkashPayment] = useExecuteBkashPaymentMutation();
  const [result, setResult] = useState({ state: "processing", message: "" });
  const hasExecuted = useRef(false);

  useEffect(() => {
    // Prevent strict-mode double firing
    if (hasExecuted.current) return;
    
    async function processCallback() {
      if (!paymentID || !status) {
        setResult({
          state: "error",
          message: t("paymentsPage.messages.invalidCallback", "Invalid bKash callback parameters.")
        });
        return;
      }

      if (status !== "success") {
        setResult({
          state: "error",
          message: t("paymentsPage.messages.paymentCancelled", "Payment was cancelled or failed.")
        });
        return;
      }

      // merchantInvoiceNumber holds our internal payment ID mapped during creation
      if (!merchantInvoiceNumber) {
        setResult({
          state: "error",
          message: t("paymentsPage.messages.missingInvoice", "Missing invoice reference.")
        });
        return;
      }

      hasExecuted.current = true;
      try {
        await executeBkashPayment({
          paymentID,
          paymentId: merchantInvoiceNumber 
        }).unwrap();

        setResult({
          state: "success",
          message: t("paymentsPage.messages.paymentSuccess", "Payment verified and completed successfully!")
        });
      } catch (err) {
        setResult({
          state: "error",
          message: err?.data?.message || err?.error || t("paymentsPage.messages.paymentExecuteFailed", "Failed to verify the transaction.")
        });
      }
    }

    processCallback();
  }, [paymentID, status, merchantInvoiceNumber, executeBkashPayment, t]);

  return (
    <section className="container-page py-10 md:py-16">
      <div className="mx-auto max-w-xl text-center">
        {result.state === "processing" ? (
          <div className="site-panel rounded-[30px] p-10">
            <h2 className="text-2xl font-black text-slate-800">
              {t("paymentsPage.processingPayment", "Processing Payment...")}
            </h2>
            <div className="mt-6 flex justify-center">
              <InlineLoader label={t("paymentsPage.loading", "Loading")} />
            </div>
          </div>
        ) : result.state === "success" ? (
          <div className="site-panel rounded-[30px] p-10 bg-emerald-50 border-emerald-200">
            <svg className="mx-auto h-16 w-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-2xl font-black text-emerald-800">
              {t("paymentsPage.paymentSuccessTitle", "Payment Successful!")}
            </h2>
            <p className="mt-2 font-medium text-emerald-700">{result.message}</p>
            <button
              className="site-button-primary mt-6"
              onClick={() => router.push("/payments")}
            >
              {t("paymentsPage.returnToPayments", "Return to Payments")}
            </button>
          </div>
        ) : (
          <div className="site-panel rounded-[30px] p-10 bg-rose-50 border-rose-200">
            <svg className="mx-auto h-16 w-16 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-2xl font-black text-rose-800">
              {t("paymentsPage.paymentFailedTitle", "Payment Failed")}
            </h2>
            <p className="mt-2 font-medium text-rose-700">{result.message}</p>
            <button
              className="site-button-secondary mt-6 border-rose-300 text-rose-700 hover:bg-rose-100"
              onClick={() => router.push("/payments")}
            >
              {t("paymentsPage.returnToPayments", "Return to Payments")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
