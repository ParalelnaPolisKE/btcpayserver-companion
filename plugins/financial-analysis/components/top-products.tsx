import { Package } from "lucide-react";

interface TopProductsProps {
  products: Array<{
    product: string;
    count: number;
  }>;
}

export function TopProducts({ products }: TopProductsProps) {
  const maxCount = Math.max(...products.map((p) => p.count));

  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No product data available
        </p>
      ) : (
        products.map((product, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{product.product}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {product.count} sold
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(product.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
