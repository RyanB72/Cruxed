import { Spinner } from "@/components/ui/spinner";

export default function ParticipantLoading() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <Spinner size="lg" />
    </div>
  );
}
