import {
  LoadingRegion,
  SkeletonCard,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading billing" className="flex flex-col gap-6 lg:gap-7">
      <SkeletonPageHeader actions={1} />
      <SkeletonCard lines={4} />
      <SkeletonTable rows={6} cols={5} />
    </LoadingRegion>
  );
}
