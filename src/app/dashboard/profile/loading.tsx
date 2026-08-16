import { LoadingRegion, SkeletonCard, SkeletonPageHeader } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading your profile" className="flex flex-col gap-6 lg:gap-7">
      <SkeletonPageHeader actions={0} />
      <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={4} />
      </div>
    </LoadingRegion>
  );
}
