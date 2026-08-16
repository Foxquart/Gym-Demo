import {
  LoadingRegion,
  SkeletonCardGrid,
  SkeletonPageHeader,
  SkeletonToolbar,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Loading the timetable" className="flex flex-col gap-6 lg:gap-7">
      <SkeletonPageHeader actions={1} />
      <SkeletonToolbar />
      <SkeletonCardGrid count={6} />
    </LoadingRegion>
  );
}
