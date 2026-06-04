import Logo from "@/components/common/Logo";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "@/images";
import { Home, Search, ShoppingBag, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10 relative">
      {/* Logo at top left */}
      <div className="absolute top-8 left-8">
        <Logo />
      </div>

      {/* Main Content */}
      <div className="max-w-3xl w-full text-center">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* 404 with background image */}
          <div className="relative w-full h-[400px] flex items-center justify-center bg-center bg-no-repeat">
            <Image
              src={notFound}
              alt="404 Background"
              fill
              className="object-contain"
              priority
            />
            <h1 className="absolute text-8xl md:text-9xl font-extrabold text-gofarm-green z-10">
              404
            </h1>
          </div>

          {/* Content Box */}
          <div className="-mt-12 space-y-6 z-50">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Look like you&apos;re lost
            </h3>

            <p className="text-lg text-gray-600">
              The page you are looking for is not available!
            </p>

            {/* Action Button */}
            <div className="pt-4">
              <Link href="/">
                <Button className="bg-gofarm-green hover:bg-gofarm-green/90 text-white font-semibold px-8 py-6 text-base rounded-md shadow-lg hover:shadow-xl transition-all">
                  Go to Home
                </Button>
              </Link>
            </div>

            {/* Additional Links */}
            <div className="pt-8 space-y-4">
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/shop">
                  <Button
                    variant="outline"
                    className="border-2 border-gofarm-green/20 hover:border-gofarm-green hover:bg-gofarm-green/5 group"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Shop Now
                  </Button>
                </Link>
                <Link href="/help">
                  <Button
                    variant="outline"
                    className="border-2 border-gofarm-green/20 hover:border-gofarm-green hover:bg-gofarm-green/5 group"
                  >
                    <HelpCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Get Help
                  </Button>
                </Link>
                <Link href="/search">
                  <Button
                    variant="outline"
                    className="border-2 border-gofarm-green/20 hover:border-gofarm-green hover:bg-gofarm-green/5 group"
                  >
                    <Search className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Search
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
