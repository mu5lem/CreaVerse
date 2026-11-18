import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/contests")({
  beforeLoad: () => { throw redirect({ to: "/outreach", search: { tab: "contests", q: "" }, replace: true }); },
});
