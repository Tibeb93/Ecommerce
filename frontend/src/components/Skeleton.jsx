const Skeleton = ({ className = "", width, height }) => (
  <div
    className={`animate-pulse rounded-xl bg-white/10 ${className}`}
    style={{ width, height }}
  />
);

export const ProductCardSkeleton = () => (
  <div className="glass overflow-hidden">
    <Skeleton className="w-full h-[180px] !rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-20 !rounded-lg" />
      </div>
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="glass p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
    <Skeleton className="w-full h-[280px] !rounded-xl" />
    <div className="space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-32 !rounded-lg" />
    </div>
  </div>
);

export const CartItemSkeleton = () => (
  <div className="glass flex items-center gap-4 p-4">
    <Skeleton className="w-[70px] h-[70px] !rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-8 w-20 !rounded-lg" />
  </div>
);

export const HeroSkeleton = () => (
  <div className="glass p-4 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-32 !rounded-lg" />
    </div>
    <div className="grid grid-cols-3 gap-2">
      <Skeleton className="h-20 !rounded-xl" />
      <Skeleton className="h-20 !rounded-xl" />
      <Skeleton className="h-20 !rounded-xl" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-white/10">
    <Skeleton className="w-10 h-10 !rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="h-6 w-16" />
  </div>
);

export default Skeleton;
