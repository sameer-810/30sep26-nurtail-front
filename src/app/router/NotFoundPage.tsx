import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="We can't find that page"
      body="The link may be out of date, or the record may belong to another organisation."
      action={
        <Link to="/dashboard" className="nt-btn-primary">
          Go to your home screen
        </Link>
      }
    />
  );
}
