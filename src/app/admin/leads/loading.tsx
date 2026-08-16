import { LoadingRegion, SkeletonPageHeader, SkeletonRows } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading enquiries" className="flex flex-col gap-5 lg:gap-6">
      <SkeletonPageHeader actions={1} />
      <SkeletonRows rows={6} />
    </LoadingRegion>
  );
}
