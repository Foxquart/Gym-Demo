import {
  LoadingRegion,
  SkeletonPageHeader,
  SkeletonStatTiles,
  SkeletonTable,
  SkeletonToolbar,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading payments" className="flex flex-col gap-5 lg:gap-6">
      <SkeletonPageHeader actions={1} />
      <SkeletonStatTiles count={3} className="xl:grid-cols-3" />
      <SkeletonToolbar />
      <SkeletonTable rows={10} cols={6} />
    </LoadingRegion>
  );
}
