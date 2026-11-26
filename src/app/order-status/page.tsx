"use client";

import { MainHeader } from "@/components/main-header";
import { OrderStatus } from "@/components/order-status";
import { ErrorPage } from "@/components/order-status/error";
import { AnimatedBackground } from "@/components/ui/custom";
import { useAuth } from "@/contexts/auth-provider";
import { useCartActions } from "@/hooks/use-cart-actions";
import { useAuthStore } from "@/stores/auth-store";
import { useOrderStatus } from "@/hooks/use-order-status";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { PaymentReturnBanner } from "@/components/orders/payment-return-banner";
import { LoadingPage } from "../../components/order-status/loading";

export default function OrderStatusPage() {
  const router = useRouter();

  const { isAuthenticated, user } = useAuth();

  const {
    order,
    loading,
    error,
    isRefreshing,
    secondsUntilRefresh,
    refresh,
    getStatusMessage,
  } = useOrderStatus();
  const { totalItems } = useCartActions();

  const data = {
    order,
    isRefreshing,
    secondsUntilRefresh,
    refresh,
    getStatusMessage,
  };

  const errorData = {
    totalItems,
    error,
  };

  // O Zustand persist hidrata a sessão do localStorage de forma assíncrona:
  // até terminar, isAuthenticated é `false` mesmo para quem está logado. Sem
  // esperar, todo F5 aqui - e a volta do Mercado Pago depois de pagar, que
  // recarrega a página inteira - mandava o cliente para a home (mesmo
  // cuidado do ProtectedRoute).
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/");
    }
  }, [hasHydrated, isAuthenticated, router, user]);

  // Loading state
  if (!hasHydrated || loading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Error state
  if (error || !order) {
    return <ErrorPage data={errorData} />;
  }

  return (
    <AnimatedBackground showBlobs={true} blobCount={2}>
      <MainHeader
        cartItems={totalItems}
        onCartClick={() => router.push("/cart")}
        showSearch={false}
        showLocation
        showCart
        showOrders
        showNotifications
      />
      <div className="min-h-screen">
        <main className="pt-28 pb-8">
          <div className="mx-auto w-full max-w-[800px] px-5">
            {/* Volta do pagamento aprovado no Mercado Pago (?payment=success), ML-01. */}
            <Suspense fallback={null}>
              <PaymentReturnBanner
                findOrderStatus={(id) => (id === order.id ? order.rawStatus : null)}
                onRefresh={refresh}
              />
            </Suspense>
            <OrderStatus data={data} />
          </div>
        </main>
      </div>
    </AnimatedBackground>
  );
}
