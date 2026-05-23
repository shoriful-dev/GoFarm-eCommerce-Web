'use client';

import React, { useEffect, useState } from 'react';
import useCartStore from '@/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import EmptyCart from '@/components/EmptyCart';
import PriceFormatter from '@/components/PriceFormatter';
import CouponInput from '@/components/CouponInput';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import QuantityButtons from '@/components/QuantityButtons';
import { AddressSelector } from './AddressSelector';
import { CheckoutButton } from './CheckoutButton';
import { Trash2, AlertTriangle, X, LogIn, Heart, Star, ArrowRight, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { OrderSummary } from '@/components/shared/OrderSummary';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { computeShipping, computeTax } from '@/lib/store-settings';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';

interface Address {
  _id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  default: boolean;
  createdAt: string;
}

interface UserOrder {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  currency: string;
  status: string;
  orderDate: string;
  customerName: string;
  email: string;
}

interface ServerCartContentProps {
  userEmail: string;
  userAddresses: Address[];
  userOrders: UserOrder[];
  onAddressesRefresh?: () => Promise<void>;
  isAuthenticated: boolean;
}

export function ServerCartContent({
  userEmail,
  userAddresses,
  userOrders,
  onAddressesRefresh,
  isAuthenticated,
}: ServerCartContentProps) {
  const {
    items: cart,
    getSubTotalPrice,
    getTotalDiscount,
    resetCart,
    setOrderPlacementState,
    isPlacingOrder,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getCouponDiscount,
  } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);

  // Pull money/shipping/tax/threshold from the storeSettings singleton.
  const settings = useStoreSettings();

  // Wait for client-side hydration
  useEffect(() => {
    // Small delay to ensure Zustand persist has loaded from localStorage
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Reset order placement state when cart page loads to clear any stale state
  useEffect(() => {
    setOrderPlacementState(false, 'validating');
  }, [setOrderPlacementState]);

  const handleResetCart = () => {
    setShowClearModal(true);
  };

  const confirmResetCart = async () => {
    try {
      await resetCart();
      setShowClearModal(false);
      toast.success('Cart cleared successfully from both local and database');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart completely');
      setShowClearModal(false);
    }
  };

  // Set default address on mount
  useEffect(() => {
    const defaultAddress = userAddresses.find((addr) => addr.default);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress);
    } else if (userAddresses.length > 0) {
      setSelectedAddress(userAddresses[0]);
    }
  }, [userAddresses]);

  // New pricing structure:
  // 1. Subtotal = gross amount (sum of original prices before discount)
  // 2. Discount = total discount amount
  // 3. Current subtotal = after product discount
  // 4. Coupon discount
  // 5. Final calculations with shipping and tax
  const grossSubtotal = getSubTotalPrice(); // Gross amount (before discount)
  const totalDiscount = getTotalDiscount(); // Total discount amount (product discounts)
  const currentSubtotal = grossSubtotal - totalDiscount; // After product discount

  // Coupon discount
  const couponDiscount = getCouponDiscount();
  const subtotalAfterCoupon = currentSubtotal - couponDiscount;

  const shipping = computeShipping(subtotalAfterCoupon, settings);
  const tax = computeTax(subtotalAfterCoupon, settings);

  // Don't show order placement skeleton in ServerCartContent
  // The overlay is handled by CheckoutButton component instead

  // Show loading while hydrating to prevent flash of empty cart
  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-gofarm-light-gray rounded-lg p-3 sm:p-4 bg-white animate-pulse"
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-md" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded w-1/3 mt-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="border border-gofarm-light-gray rounded-lg p-4 sm:p-6 bg-white animate-pulse">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded mt-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show empty cart while placing order to prevent flash during redirect
  if ((!cart || cart.length === 0) && !isPlacingOrder) {
    return (
      <div className="space-y-8">
        <EmptyCart />

        {/* Show recent orders if available */}
        {userOrders.length > 0 && (
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {userOrders.slice(0, 3).map((order) => (
                <div
                  key={order._id}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <PriceFormatter amount={order.totalPrice} />
                    <Badge
                      variant={order.status === 'delivered' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/user/orders">
                <Button variant="outline" className="w-full">
                  View All Orders
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Page header: title + remove all */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gofarm-black">
          Cart{' '}
          <span className="text-gofarm-gray font-medium text-base sm:text-lg">
            ({cart.length} {cart.length === 1 ? 'item' : 'items'})
          </span>
        </h1>
        <button
          type="button"
          onClick={handleResetCart}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
          Remove All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 lg:items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items table card */}
          <div className="border border-gofarm-light-gray rounded-xl bg-white overflow-hidden shadow-sm">
            {/* Column headers \u2014 desktop only */}
            <div className="hidden md:grid grid-cols-[2.2fr_1fr_1fr_1fr_0.8fr] gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gofarm-gray border-b border-gofarm-light-gray">
              <div>Product</div>
              <div>Price</div>
              <div>Quantity</div>
              <div>Total Price</div>
              <div className="text-right">Action</div>
            </div>

            {cart.map((item, idx) => {
              const price = item.product.price || 0;
              const originalPrice =
                (
                  item.product as unknown as {
                    discount?: number;
                    price?: number;
                  }
                ).discount && price
                  ? price /
                    (1 - ((item.product as unknown as { discount?: number }).discount || 0) / 100)
                  : null;
              const stock = item.product.stock ?? 0;
              const isOOS = stock === 0;
              const lineTotal = price * item.quantity;
              return (
                <div
                  key={item.product._id}
                  className={cn(
                    'px-4 sm:px-5 py-4 md:grid md:grid-cols-[2.2fr_1fr_1fr_1fr_0.8fr] md:gap-4 md:items-center',
                    idx !== cart.length - 1 && 'border-b border-gofarm-light-gray',
                  )}
                >
                  {/* Product cell */}
                  <div className="flex gap-3 sm:gap-4">
                    <Link href={`/product/${item.product.slug?.current}`} className="shrink-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={
                            item.product.images?.[0]
                              ? urlFor(item.product.images[0]).url()
                              : '/placeholder.jpg'
                          }
                          alt={item.product.name || 'Product'}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.product.slug?.current}`}
                        className="font-semibold text-sm sm:text-[15px] text-gofarm-black hover:text-gofarm-green transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      {/* Variants summary line */}
                      {(item.product.categories ||
                        (item.product as unknown as { color?: string }).color) && (
                        <p className="text-xs text-gofarm-gray mt-1 line-clamp-1">
                          {[
                            (item.product as unknown as { color?: string }).color,
                            (item.product as unknown as { size?: string }).size,
                            item.product.categories?.[0]
                              ? (
                                  item.product.categories[0] as unknown as {
                                    name?: string;
                                    title?: string;
                                  }
                                ).name ||
                                (
                                  item.product.categories[0] as unknown as {
                                    title?: string;
                                  }
                                ).title
                              : null,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-gofarm-gray mt-0.5">
                        Available:{' '}
                        <span
                          className={cn(
                            'font-medium',
                            isOOS
                              ? 'text-red-500'
                              : stock < 5
                                ? 'text-amber-600'
                                : 'text-gofarm-black',
                          )}
                        >
                          {stock}
                        </span>
                      </p>
                      {/* Rating */}
                      {(item.product as unknown as { rating?: number }).rating !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => {
                            const r = (item.product as unknown as { rating?: number }).rating || 0;
                            return (
                              <Star
                                key={s}
                                className={cn(
                                  'w-3.5 h-3.5',
                                  r >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
                                )}
                              />
                            );
                          })}
                          <span className="text-xs text-gofarm-gray ml-1">
                            (
                            {(
                              item.product as unknown as {
                                reviewCount?: number;
                              }
                            ).reviewCount || 0}
                            )
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price cell */}
                  <div className="mt-3 md:mt-0 flex items-center gap-2 md:block">
                    <span className="md:hidden text-xs text-gofarm-gray">Price:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm sm:text-base text-gofarm-black">
                        <PriceFormatter amount={price} />
                      </span>
                      {originalPrice && (
                        <span className="text-xs text-gofarm-gray line-through">
                          <PriceFormatter amount={originalPrice} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity cell */}
                  <div className="mt-3 md:mt-0">
                    <span className="md:hidden block text-xs text-gofarm-gray mb-1">Quantity</span>
                    <div className="inline-flex items-center rounded-full border border-gofarm-light-gray px-1 py-0.5">
                      <QuantityButtons product={item.product} />
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="mt-3 md:mt-0 flex items-center gap-2 md:block">
                    <span className="md:hidden text-xs text-gofarm-gray">Total:</span>
                    <span className="font-bold text-sm sm:text-base text-gofarm-black">
                      <PriceFormatter amount={lineTotal} />
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 md:mt-0 flex items-center justify-end gap-1">
                    <FavoriteCartButton product={item.product} />
                    <button
                      type="button"
                      onClick={() => {
                        useCartStore.getState().deleteCartProduct(item.product._id);
                        toast.success('Item removed from cart');
                      }}
                      title="Remove from cart"
                      className="h-9 w-9 inline-flex items-center justify-center rounded-full text-gofarm-gray hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue shopping shortcut on mobile */}
          <div className="lg:hidden">
            <Link href="/shop">
              <Button
                variant="outline"
                className="w-full border-gofarm-green text-gofarm-green hover:bg-gofarm-light-green/10"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          {/* Free shipment progress banner */}
          {isAuthenticated &&
            (() => {
              const FREE_SHIP_THRESHOLD = settings.freeShippingThreshold;
              const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotalAfterCoupon);
              const pct =
                FREE_SHIP_THRESHOLD > 0
                  ? Math.min(100, (subtotalAfterCoupon / FREE_SHIP_THRESHOLD) * 100)
                  : 100;
              return (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    {remaining > 0 ? (
                      <p className="text-gofarm-black">
                        Spend{' '}
                        <span className="font-semibold text-emerald-700">
                          <PriceFormatter amount={remaining} />
                        </span>{' '}
                        for <span className="font-semibold text-emerald-700">Free Shipment</span>
                      </p>
                    ) : (
                      <p className="text-emerald-700 font-medium">You qualify for free shipping!</p>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}

          {/* Address Selection */}
          {isAuthenticated && (
            <AddressSelector
              userEmail={userEmail}
              addresses={userAddresses}
              selectedAddress={selectedAddress}
              onAddressSelect={setSelectedAddress}
              onAddressesRefresh={onAddressesRefresh}
            />
          )}

          {/* Sign in prompt for guests */}
          {!isAuthenticated && (
            <div className="border-2 border-amber-200 rounded-xl p-6 bg-amber-50/60 shadow-sm">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <LogIn className="h-8 w-8 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Sign in to Continue</h3>
                  <p className="text-gray-600 max-w-sm">
                    Please sign in or create an account to view pricing details and complete your
                    purchase.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button asChild className="bg-gofarm-green hover:bg-gofarm-light-green">
                    <Link href="/sign-in?redirectTo=/cart">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-gofarm-green text-gofarm-green hover:bg-gofarm-green/10"
                  >
                    <Link href="/sign-up?redirectTo=/cart">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary card with coupon */}
          {isAuthenticated && (
            <div className="border border-gofarm-light-gray rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gofarm-light-gray">
                <h3 className="text-base sm:text-lg font-bold text-gofarm-black mb-3">
                  Order Summary
                </h3>
                <CouponInput
                  subtotal={currentSubtotal}
                  cartItems={cart.map((item) => ({
                    productId: item.product._id!,
                    quantity: item.quantity,
                    price: item.product.price || 0,
                  }))}
                  onCouponApplied={(coupon) => {
                    if (coupon) {
                      applyCoupon(coupon);
                    } else {
                      removeCoupon();
                    }
                  }}
                  appliedCoupon={appliedCoupon}
                />
              </div>
              <div className="p-4 sm:p-5">
                <OrderSummary
                  data={{
                    subtotal: grossSubtotal,
                    shipping,
                    tax,
                    productDiscount: totalDiscount,
                    couponDiscount,
                    couponCode: appliedCoupon?.code,
                    itemCount: cart.length,
                    showHeader: false,
                    showBreakdown: true,
                    showMessages: false,
                    variant: 'detailed',
                  }}
                />
              </div>
            </div>
          )}

          {/* Terms + checkout actions */}
          {isAuthenticated && (
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-sm text-gofarm-black cursor-pointer select-none">
                <Checkbox
                  checked={agreeToTerms}
                  onCheckedChange={(v) => setAgreeToTerms(!!v)}
                  className="mt-0.5"
                />
                <span>
                  I agree with the{' '}
                  <Link href="/terms" className="text-gofarm-green hover:underline font-medium">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-gofarm-green hover:underline font-medium">
                    conditions
                  </Link>
                </span>
              </label>
              <CheckoutButton
                cart={cart}
                selectedAddress={selectedAddress}
                isAuthenticated={isAuthenticated}
                disabled={!agreeToTerms}
              />
              <Link href="/shop" className="block">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-gofarm-light-gray text-gofarm-black hover:bg-gofarm-light-green/10"
                >
                  Continue shopping
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className={cn(
              'fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg',
            )}
          >
            <VisuallyHidden.Root>
              <DialogTitle>Clear Cart Confirmation</DialogTitle>
            </VisuallyHidden.Root>
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border-4 border-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Clear Cart</h3>
                <p className="text-gray-600 leading-relaxed">
                  You&apos;re about to remove{' '}
                  <span className="font-semibold text-red-600">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </span>{' '}
                  from your cart. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => setShowClearModal(false)}
                className="flex-1 border-gray-300 hover:bg-gray-50 font-medium"
              >
                Keep Items
              </Button>
              <Button
                variant="destructive"
                onClick={confirmResetCart}
                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500 font-semibold shadow-lg hover:shadow-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            </div>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}

/**
 * Heart icon that toggles the cart item in/out of the wishlist. Lives in
 * the cart-row "Action" column.
 */
function FavoriteCartButton({ product }: { product: import('@/sanity.types').Product }) {
  const { favoriteProduct, addToFavorite } = useCartStore();
  const isFavorite = favoriteProduct.some((p) => p?._id === product._id);
  return (
    <button
      type="button"
      onClick={async () => {
        await addToFavorite(product);
        toast.success(isFavorite ? 'Removed from wishlist' : 'Added to wishlist');
      }}
      title={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
      className={cn(
        'h-9 w-9 inline-flex items-center justify-center rounded-full transition-colors',
        isFavorite
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gofarm-gray hover:text-red-500 hover:bg-red-50',
      )}
    >
      <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
    </button>
  );
}
