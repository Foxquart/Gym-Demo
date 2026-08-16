import {
  LoadingRegion,
  SkeletonCard,
  SkeletonPageHeader,
  SkeletonStatTiles,
  SkeletonTable,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading member" className="flex flex-col gap-5 lg:gap-6">
      <SkeletonPageHeader actions={2} />
      <SkeletonStatTiles count={4} />
      <SkeletonCard lines={4} />
      <SkeletonTable rows={5} cols={5} />
      <SkeletonTable rows={5} cols={5} />
    </LoadingRegion>
  );
}
