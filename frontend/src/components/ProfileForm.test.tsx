import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileForm } from "./ProfileForm";
import type { Profile } from "../lib/api";

const baseProfile: Profile = {
  id: "p1",
  name: "Test Profile",
  fingerprint_seed: 12345,
  proxy: null,
  timezone: null,
  locale: null,
  platform: "windows",
  user_agent: null,
  screen_width: 1920,
  screen_height: 1080,
  gpu_vendor: null,
  gpu_renderer: null,
  hardware_concurrency: null,
  humanize: false,
  human_preset: "default",
  headless: false,
  geoip: false,
  clipboard_sync: true,
  auto_launch: false,
  color_scheme: null,
  launch_args: [],
  notes: null,
  tags: [],
  user_data_dir: "/data/p1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  status: "running",
  vnc_ws_port: 5901,
  cdp_url: "/api/profiles/p1/cdp",
};

describe("ProfileForm", () => {
  it("shows a running notice and custom cancel label while profile is running", () => {
    render(
      <ProfileForm
        profile={baseProfile}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        isRunning
        cancelLabel="Back to browser"
      />,
    );

    expect(screen.getByText(/Profile is running/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to browser" })).toBeTruthy();
    expect(screen.getByDisplayValue("Test Profile")).toBeTruthy();
  });

  it("does not show the running notice in normal edit mode", () => {
    render(
      <ProfileForm
        profile={{ ...baseProfile, status: "stopped" }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Profile is running/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });
});
