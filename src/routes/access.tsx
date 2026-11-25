import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy links now land on the birthday passcode prompt at /. */
export const Route = createFileRoute("/access")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
