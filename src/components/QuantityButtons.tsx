import { Button } from './ui/button';
import { HiMinus, HiPlus } from 'react-icons/hi2';
import { showToast } from '@/lib/toast';
import { Product, PRODUCT_BY_SLUG_QUERY_RESULT } from '@/sanity.types';
import { twMerge } from 'tailwind-merge';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics';
import useCartStore from '../../store';

interface Props {
  product: Product | PRODUCT_BY_SLUG_QUERY_RESULT;
  className?: string;
  borderStyle?: string;
}

const QuantityButtons = ({ product, className, borderStyle }: Props) => {
  const { addItem, removeItem, getItemCount } = useCartStore();
  const itemCount = getItemCount(product?._id || '');
  const isOutOfStock = product?.stock === 0;

  const baseWeight = (product as any)?.baseWeight;
  const selectedWeight = (product as any)?.selectedWeight;
  let qtyUnit = 1;
  let displayUnit = '';

  if (baseWeight && selectedWeight?.numericValue) {
    qtyUnit = selectedWeight.numericValue / baseWeight;
    // Display as kg if baseWeight is used
    displayUnit = 'kg';
  }

  const handleRemoveProduct = () => {
    if (!product?._id) return;
    removeItem(product._id);
    const newCount = itemCount - qtyUnit;
    if (newCount > 0) {
      showToast.success(
        'Quantity Updated',
        `${product?.name} quantity decreased to ${newCount}${displayUnit}`,
      );
    } else {
      showToast.success('Item Removed', `${product?.name} removed from your cart`);
    }
    // Firebase Analytics event
    trackRemoveFromCart({
      productId: product._id,
      name: product.name || 'Unknown',
      price: product.price ?? 0,
      quantity: newCount,
    });
  };

  const handleAddToCart = () => {
    if (!product?._id) return;
    const maxStock = product?.stock ?? 0;
    const newCount = itemCount + qtyUnit;

    if (maxStock >= newCount) {
      addItem(product as Product);
      showToast.success(
        'Quantity Updated',
        `${product?.name} quantity increased to ${newCount}${displayUnit}`,
      );
      // Firebase Analytics event
      trackAddToCart({
        productId: product._id,
        name: product.name || 'Unknown',
        price: product.price ?? 0,
        quantity: newCount,
      });
    } else {
      showToast.error('Stock Limit Reached', `Only ${maxStock}${displayUnit} available in stock`);
    }
  };
  return (
    <div className={twMerge('flex items-center gap-1 pb-1 text-base', borderStyle, className)}>
      <Button
        variant="outline"
        size="icon"
        className="w-6 h-6 border-0 hover:bg-gofarm-green/20"
        onClick={handleRemoveProduct}
        disabled={itemCount === 0 || isOutOfStock}
      >
        <HiMinus />
      </Button>
      <span className="font-semibold text-sm w-6 text-center text-gofarm-black">
        {itemCount}
        {displayUnit}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="w-6 h-6 border-0 hover:bg-gofarm-green/20"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
      >
        <HiPlus />
      </Button>
    </div>
  );
};

export default QuantityButtons;
