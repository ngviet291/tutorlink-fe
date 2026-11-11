import { describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { StrictMode } from "react";
import authReducer, { clearUser, setUser } from "@/features/auth/store/authSlice";
import { unauthorizedEvent } from "@/config/events/emitter";
import type { IRealtimeClient } from "@/config/realtime/IRealtimeClient";
import { RealtimeEventRouter } from "@/config/realtime/RealtimeEventRouter";
import type { RealtimeEnvelope } from "@/config/realtime/realtime.types";
import type { AuthUser } from "@/features/user/types/user.types";
import { RealtimeBridge } from "./RealtimeBridge";

const user = (id: string) => ({ id }) as unknown as AuthUser;

function setup() {
  let eventListener: ((e: RealtimeEnvelope) => void) | null = null;
  const client = {
    connect: vi.fn(),
    disconnect: vi.fn(async () => {}),
    onEvent: vi.fn((l: (e: RealtimeEnvelope) => void) => {
      eventListener = l;
      return () => {
        eventListener = null;
      };
    }),
    onStatus: vi.fn(() => () => {}),
    onConnected: vi.fn(() => () => {}),
    getStatus: vi.fn(() => "disconnected" as const),
  } satisfies IRealtimeClient;
  const router = new RealtimeEventRouter();
  const store = configureStore({ reducer: { auth: authReducer } });
  const ui = (strict = false) => {
    const tree = (
      <Provider store={store}>
        <RealtimeBridge client={client} router={router} />
      </Provider>
    );
    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
  return { client, router, store, ui, emit: (e: RealtimeEnvelope) => eventListener?.(e) };
}

describe("RealtimeBridge", () => {
  it("chưa đăng nhập thì không connect", () => {
    const { client, ui } = setup();
    render(ui());
    expect(client.connect).not.toHaveBeenCalled();
  });

  it("có user (login / register / restore session) → connect", () => {
    const { client, store, ui } = setup();
    render(ui());
    act(() => void store.dispatch(setUser(user("u1"))));
    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it("restore session: user có sẵn lúc mount → connect", () => {
    const { client, store, ui } = setup();
    store.dispatch(setUser(user("u1")));
    render(ui());
    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it("logout (clearUser) → disconnect", () => {
    const { client, store, ui } = setup();
    store.dispatch(setUser(user("u1")));
    render(ui());
    act(() => void store.dispatch(clearUser()));
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });

  it("đổi user → ngắt kết nối cũ rồi nối lại", () => {
    const { client, store, ui } = setup();
    store.dispatch(setUser(user("u1")));
    render(ui());
    act(() => void store.dispatch(setUser(user("u2"))));
    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(client.connect).toHaveBeenCalledTimes(2);
  });

  it("cập nhật cùng user (updateUser) không reconnect", () => {
    const { client, store, ui } = setup();
    store.dispatch(setUser(user("u1")));
    render(ui());
    act(() => void store.dispatch(setUser({ ...user("u1"), fullName: "B" } as AuthUser)));
    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it("unauthorizedEvent → disconnect", () => {
    const { client, store, ui } = setup();
    store.dispatch(setUser(user("u1")));
    render(ui());
    act(() => unauthorizedEvent.emit());
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });

  it("chuyển event từ client sang router", () => {
    const { router, ui, emit } = setup();
    const handler = vi.fn();
    router.register("MESSAGE_NEW", handler);
    render(ui());
    emit({ type: "MESSAGE_NEW", occurredAt: "t", data: {} });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("unmount → hủy đăng ký và disconnect", () => {
    const { client, store, ui } = setup();
    store.dispatch(setUser(user("u1")));
    const { unmount } = render(ui());
    unmount();
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });
});
