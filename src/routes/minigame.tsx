import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/minigame")({
  beforeLoad: () => {
    throw redirect({ to: "/mind-garden", search: { tab: "minigame" }, replace: true });
  },
});
