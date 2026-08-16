import {
  LoadingRegion,
  SkeletonCard,
  SkeletonChart,
  SkeletonPageHeader,
  SkeletonStatTiles,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading the command centre" className="flex flex-col gap-5 lg:gap-6">
      <SkeletonPageHeader actions={1} />
      <SkeletonStatTiles count={6} className="xl:grid-cols-3 2xl:grid-cols-6" />
      <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-5">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>
    </LoadingRegion>
  );
}
