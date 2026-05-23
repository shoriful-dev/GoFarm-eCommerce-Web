import { memo } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  amount: number | undefined;
  className?: string;
}

const PriceFormatter = memo(({ amount, className }: Props) => {
  const formattedPrice = new Number(amount).toLocaleString('en-US', {
    currency: 'USD',
    style: 'currency',
    minimumFractionDigits: 2,
  });
  return (
    <span className={twMerge('text-sm font-semibold text-gofarm-black', className)}>
      {formattedPrice}
    </span>
  );
});

PriceFormatter.displayName = 'PriceFormatter';

export default PriceFormatter;
