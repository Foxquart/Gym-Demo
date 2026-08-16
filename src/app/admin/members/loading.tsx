import {
  LoadingRegion,
  SkeletonPageHeader,
  SkeletonTable,
  SkeletonToolbar,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading members" className="flex flex-col gap-5 lg:gap-6">
      <SkeletonPageHeader actions={1} />
      <SkeletonToolbar />
      <SkeletonTable rows={10} cols={6} />
    </LoadingRegion>
  );
}
