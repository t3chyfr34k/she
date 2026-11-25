import { createFileRoute, redirect } from "@tanstack/react-router";

// Custom pages are part of the birthday site, so return visitors to its passcode prompt.
export const Route = createFileRoute("/p/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
