"use client";

import { useState } from "react";
import Container from "./Container";
import Title from "./Title";
import FeatureModal from "./FeatureModal";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  RefreshCw,
  Award,
  Clock,
  Heart,
  LucideIcon,
} from "lucide-react";

interface FeatureType {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  iconColor: string;
  details: string[];
  benefits: string[];
}

const ShopFeatures = () => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureType | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features: FeatureType[] = [
    {
      icon: ShieldCheck,
      title: "Secure Shopping",
      description: "100% secure payment with SSL encryption",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      details: [
        "Advanced SSL encryption protects all your transactions and personal data during checkout",
        "PCI DSS compliant payment processing ensures industry-standard security measures",
        "Secure payment gateways from trusted providers like Stripe and PayPal",
        "Regular security audits and monitoring to detect and prevent fraud",
        "Your financial information is never stored on our servers",
      ],
      benefits: [
        "Shop with complete confidence",
        "Protected personal information",
        "Safe payment processing",
        "Fraud prevention systems",
        "Encrypted data transmission",
        "Verified secure checkout",
      ],
    },
    {
      icon: Truck,
      title: "Free Delivery",
      description: "Free shipping on orders over $50",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      details: [
        "Enjoy free standard shipping on all orders over $50 to anywhere in the country",
        "Track your package in real-time with our advanced tracking system",
        "Partner with reliable carriers for timely and safe delivery",
        "Eco-friendly packaging materials to reduce environmental impact",
        "Delivery within 3-7 business days depending on your location",
      ],
      benefits: [
        "Save money on shipping",
        "Real-time order tracking",
        "Reliable delivery partners",
        "Eco-friendly packaging",
        "Doorstep delivery",
        "No hidden charges",
      ],
    },
    {
      icon: CreditCard,
      title: "Easy Payments",
      description: "Multiple payment options available",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      details: [
        "Accept all major credit and debit cards including Visa, Mastercard, and Amex",
        "Digital wallets like PayPal, Apple Pay, and Google Pay for faster checkout",
        "Buy now, pay later options available through trusted partners",
        "Secure one-click checkout for returning customers",
        "International payment methods supported for global shopping",
      ],
      benefits: [
        "Multiple payment options",
        "Quick one-click checkout",
        "Flexible payment plans",
        "Saved payment methods",
        "International cards accepted",
        "Instant payment confirmation",
      ],
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated customer support anytime",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      details: [
        "Round-the-clock customer support via live chat, email, and phone",
        "Knowledgeable support team ready to help with any questions or issues",
        "Average response time of under 2 minutes for live chat inquiries",
        "Multi-language support to assist customers worldwide",
        "Comprehensive FAQ and help center for self-service solutions",
      ],
      benefits: [
        "24/7 availability",
        "Quick response times",
        "Expert assistance",
        "Multiple contact channels",
        "Multi-language support",
        "Helpful resources",
      ],
    },
    {
      icon: RefreshCw,
      title: "Easy Returns",
      description: "30-day hassle-free return policy",
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
      details: [
        "Return any product within 30 days of delivery with no questions asked",
        "Simple online return process - just request a return in your account",
        "Free return shipping labels provided for your convenience",
        "Full refund processed within 5-7 business days after receiving the return",
        "Exchange options available for different sizes or colors",
      ],
      benefits: [
        "30-day return window",
        "No-hassle process",
        "Free return shipping",
        "Quick refund processing",
        "Easy exchanges",
        "Full money-back guarantee",
      ],
    },
    {
      icon: Award,
      title: "Quality Assured",
      description: "100% authentic products guaranteed",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      details: [
        "Every product is sourced directly from authorized manufacturers and distributors",
        "Rigorous quality checks performed before shipping to ensure product condition",
        "Authenticity certificates available for luxury and high-value items",
        "Zero-tolerance policy for counterfeit products",
        "Quality guarantee backed by our comprehensive warranty program",
      ],
      benefits: [
        "100% authentic products",
        "Quality inspections",
        "Authorized sellers only",
        "Warranty coverage",
        "Authenticity certificates",
        "Premium product standards",
      ],
    },
    {
      icon: Clock,
      title: "Fast Processing",
      description: "Orders processed within 24 hours",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      details: [
        "All orders placed before 3 PM are processed and shipped the same day",
        "Automated order confirmation sent immediately after purchase",
        "Express shipping options available for urgent deliveries",
        "Real-time inventory system prevents overselling and delays",
        "Priority processing for members and repeat customers",
      ],
      benefits: [
        "Same-day processing",
        "Immediate confirmation",
        "Express shipping options",
        "Real-time updates",
        "Priority handling",
        "No processing delays",
      ],
    },
    {
      icon: Heart,
      title: "Best Prices",
      description: "Competitive pricing with great deals",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      details: [
        "Price match guarantee - we'll match any lower price you find elsewhere",
        "Exclusive member discounts and early access to sales",
        "Daily deals and flash sales on popular products",
        "Seasonal promotions and special holiday offers",
        "Loyalty rewards program - earn points with every purchase",
      ],
      benefits: [
        "Competitive pricing",
        "Price match guarantee",
        "Exclusive member deals",
        "Regular promotions",
        "Loyalty rewards",
        "Best value for money",
      ],
    },
  ];

  const handleFeatureClick = (feature: FeatureType) => {
    setSelectedFeature(feature);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedFeature(null), 300);
  };

  return (
    <Container className="my-16 lg:my-24">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="h-1 w-12 bg-linear-to-r from-gofarm-light-green to-gofarm-green rounded-full"></div>
          <Title className="text-3xl lg:text-4xl font-bold text-gofarm-black">
            Why Shop With Us
          </Title>
          <div className="h-1 w-12 bg-linear-to-l from-gofarm-light-green to-gofarm-green rounded-full"></div>
        </div>
        <p className="text-gofarm-gray text-lg max-w-2xl mx-auto">
          Experience the best online shopping with our commitment to quality,
          security, and exceptional service
        </p>
      </div>

      {/* Features Grid */}
      <div className="bg-linear-to-br from-white via-gray-50 to-gofarm-light-orange p-8 lg:p-12 rounded-3xl shadow-xl border border-gofarm-light-green/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <button
                key={index}
                onClick={() => handleFeatureClick(feature)}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-gofarm-light-green hoverEffect transform hover:-translate-y-2 cursor-pointer text-left w-full"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Icon Container */}
                <div className="flex justify-center mb-5">
                  <div
                    className={`relative w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center group-hover:shadow-lg hoverEffect`}
                  >
                    <IconComponent
                      className={`w-8 h-8 ${feature.iconColor} group-hover:scale-110 hoverEffect`}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gofarm-light-green/10 to-transparent opacity-0 group-hover:opacity-100 hoverEffect rounded-2xl"></div>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-gofarm-black group-hover:text-gofarm-green hoverEffect">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gofarm-gray leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="text-xs text-gofarm-green font-medium pt-2 opacity-0 group-hover:opacity-100 hoverEffect">
                    Click to learn more →
                  </div>
                </div>

                {/* Decorative Bottom Bar */}
                <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`bg-linear-to-r ${feature.color} h-1.5 rounded-full hoverEffect group-hover:w-full transition-all duration-500`}
                    style={{ width: "40%" }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Stats Section */}
        <div className="mt-12 pt-8 border-t border-gofarm-light-green/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold bg-linear-to-r from-gofarm-green to-gofarm-light-green bg-clip-text text-transparent mb-2">
                50K+
              </div>
              <div className="text-sm text-gofarm-gray font-medium">
                Happy Customers
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-linear-to-r from-gofarm-green to-gofarm-light-green bg-clip-text text-transparent mb-2">
                100K+
              </div>
              <div className="text-sm text-gofarm-gray font-medium">
                Products Sold
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-linear-to-r from-gofarm-green to-gofarm-light-green bg-clip-text text-transparent mb-2">
                99%
              </div>
              <div className="text-sm text-gofarm-gray font-medium">
                Satisfaction Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-linear-to-r from-gofarm-green to-gofarm-light-green bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-sm text-gofarm-gray font-medium">
                Customer Support
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-linear-to-r from-gofarm-light-orange to-gray-50 rounded-2xl border border-gofarm-light-green/20 shadow-md">
            <ShieldCheck className="w-6 h-6 text-gofarm-green" />
            <span className="text-dark-text font-semibold">
              Trusted by thousands of satisfied customers worldwide
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-5 h-5 text-yellow-400 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Modal */}
      <FeatureModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        feature={selectedFeature}
      />
    </Container>
  );
};

export default ShopFeatures;
