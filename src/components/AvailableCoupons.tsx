'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tag,
  Copy,
  Check,
  Calendar,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Gift,
  Percent,
} from 'lucide-react';
import { client } from '@/sanity/lib/client';
import { defineQuery } from 'next-sanity';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PublicCoupon {
  _id: string;
  name: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount: number;
  expiryDate?: string;
}

export default function AvailableCoupons() {
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicCoupons();
  }, []);

  const fetchPublicCoupons = async () => {
    try {
      const now = new Date().toISOString();

      const query = defineQuery(`*[
        _type == "coupon" && 
        isActive == true && 
        isPublic == true &&
        startDate <= $now &&
        (!defined(expiryDate) || expiryDate > $now)
      ] | order(discountValue desc) [0...6] {
        _id,
        name,
        code,
        description,
        discountType,
        discountValue,
        minimumOrderAmount,
        expiryDate
      }`);

      const data = await client.fetch(query, { now });
      setCoupons(data);
    } catch (error) {
      console.error('Error fetching public coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Coupon code copied!', {
      description: `Use code "${code}" at checkout`,
      icon: '🎉',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-20 bg-linear-to-br from-emerald-50 via-white to-green-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-linear(0deg,white,rgba(255,255,255,0.6))] bg-[size:32px_32px]" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded-xl w-80 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white/50 rounded-2xl animate-pulse border border-gray-100"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-20 bg-linear-to-br from-emerald-50 via-white to-green-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-linear(0deg,white,rgba(255,255,255,0.6))] bg-size-[32px_32px]" />

      {/* Floating Decorations */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-green-200/30 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-green-100 to-emerald-100 rounded-full mb-2 shadow-sm border border-green-200/50 animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-4 h-4 text-green-600 animate-pulse" />
            <span className="text-sm font-bold text-green-700 uppercase tracking-wider">
              Exclusive Deals
            </span>
            <Gift className="w-4 h-4 text-green-600" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-green-600 via-emerald-600 to-green-700 mb-4 animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
            Available Coupons & Discounts
          </h2>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto animate-in fade-in slide-in-from-top-8 duration-700 delay-200">
            Save big with our handpicked deals! Limited time offers that make shopping even more
            delightful
          </p>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
          {coupons.map((coupon, index) => (
            <Card
              key={coupon._id}
              className={cn(
                'group relative hover:shadow-2xl transition-all duration-500 border-2',
                'hover:scale-[1.02] hover:-translate-y-1',
                'bg-white/80 backdrop-blur-sm',
                'animate-in fade-in slide-in-from-bottom-8 duration-700',
                index === 0 ? 'border-green-300' : 'border-gray-200 hover:border-green-300',
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Best Deal Badge */}
              {index === 0 && (
                <div className="absolute -top-1 -right-1 z-20">
                  <Badge className="bg-linear-to-r from-amber-500 to-orange-500 text-white border-none shadow-lg rounded-bl-xl rounded-tr-xl px-4 py-1.5 font-bold text-xs animate-bounce">
                    🔥 BEST DEAL
                  </Badge>
                </div>
              )}

              <CardContent className="p-0">
                {/* linear Header with Animation */}
                <div className="relative p-6 bg-linear-to-br from-green-500 via-emerald-600 to-green-700 text-white overflow-hidden">
                  {/* Animated Background Elements */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-700 delay-100" />
                  <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent group-hover:via-white/10 transition-colors duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-2">
                        <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-white/95 transition-colors">
                          {coupon.name}
                        </h3>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
                          <TrendingDown className="w-5 h-5 animate-bounce" />
                          <span className="text-2xl font-black tracking-tight">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% OFF`
                              : `$${coupon.discountValue} OFF`}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          {coupon.discountType === 'percentage' ? (
                            <Percent className="w-6 h-6" />
                          ) : (
                            <span className="text-2xl font-bold">$</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {coupon.description && (
                      <p className="text-sm text-white/90 line-clamp-2 leading-relaxed">
                        {coupon.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content with Glass Effect */}
                <div className="p-6 space-y-4 bg-linear-to-b from-white/50 to-white backdrop-blur-sm">
                  {/* Coupon Code with Shimmer */}
                  <div className="relative group/code">
                    <div className="flex items-center gap-2 p-4 bg-linear-to-r from-gray-50 to-green-50 rounded-xl border-2 border-dashed border-gray-300 group-hover:border-green-400 group-hover:shadow-md transition-all duration-300">
                      <code className="flex-1 font-mono font-bold text-lg text-gray-900 tracking-widest">
                        {coupon.code}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => copyCode(coupon.code)}
                        className={cn(
                          'shrink-0 transition-all duration-300',
                          copiedCode === coupon.code
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-white hover:bg-green-50 text-gray-700 border border-gray-200',
                        )}
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    {/* Shimmer Effect on Hover */}
                    <div className="absolute inset-0 rounded-xl bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/code:translate-x-full transition-transform duration-1000 pointer-events-none" />
                  </div>

                  {/* Details with Icons */}
                  <div className="space-y-2.5 text-sm">
                    {coupon.minimumOrderAmount > 0 && (
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                        <div className="w-2 h-2 rounded-full bg-linear-to-r from-amber-400 to-orange-400 animate-pulse" />
                        <span className="text-gray-600">
                          Minimum order:{' '}
                          <strong className="text-gray-900 font-bold">
                            ${coupon.minimumOrderAmount}
                          </strong>
                        </span>
                      </div>
                    )}
                    {coupon.expiryDate && (
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">
                          Expires{' '}
                          <strong className="text-gray-900 font-bold">
                            {format(new Date(coupon.expiryDate), 'MMM dd, yyyy')}
                          </strong>
                        </span>
                      </div>
                    )}
                    {!coupon.expiryDate && (
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50/50 border border-green-100">
                        <Sparkles className="w-4 h-4 text-green-500" />
                        <span className="text-green-700 font-semibold">
                          No expiration • Use anytime!
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    asChild
                    className="w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/btn font-bold"
                  >
                    <Link href="/shop">
                      <span>Shop Now & Save</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Link with Enhanced Style */}
        {coupons.length >= 6 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-bold px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Link href="/shop">
                <Gift className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Explore All Special Offers
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
