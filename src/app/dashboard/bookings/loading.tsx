import { LoadingRegion, SkeletonPageHeader, SkeletonRows } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading your bookings" className="flex flex-col gap-6 lg:gap-7">
      <SkeletonPageHeader actions={1} />
      <SkeletonRows rows={3} />
      <SkeletonRows rows={4} />
    </LoadingRegion>
  );
}
