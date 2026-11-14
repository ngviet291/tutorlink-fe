import type { NotificationGateway } from "../api/notification.gateway";

export class NotificationService {
  private readonly gateway: NotificationGateway;

  constructor(gateway: NotificationGateway) {
    this.gateway = gateway;
  }

  getMyNotifications(cursor: string | undefined, limit = 10) {
    return this.gateway.getMyNotifications(cursor, limit);
  }
  markAsRead(id: string) {
    return this.gateway.markAsRead(id);
  }
  markAllAsRead() {
    return this.gateway.markAllAsRead();
  }
}
