import { LoadingRegion, SkeletonCardGrid, SkeletonPageHeader } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading plans" className="flex flex-col gap-5 lg:gap-6">
      <SkeletonPageHeader actions={1} />
      <SkeletonCardGrid count={4} media={false} className="xl:grid-cols-4" />
    </LoadingRegion>
  );
}
