import {
  LoadingRegion,
  SkeletonCard,
  SkeletonChart,
  SkeletonPageHeader,
  SkeletonStatTiles,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading your overview" className="flex flex-col gap-6 lg:gap-7">
      <SkeletonPageHeader />
      <SkeletonStatTiles count={4} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:gap-5">
        <div className="flex flex-col gap-4 xl:gap-5">
          <SkeletonCard lines={4} />
          <SkeletonChart />
        </div>
        <div className="flex flex-col gap-4 xl:gap-5">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </LoadingRegion>
  );
}
