import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/opportunities")({
  beforeLoad: () => {
    throw redirect({ to: "/outreach", search: { tab: "opportunities", q: "" }, replace: true });
  },
});
