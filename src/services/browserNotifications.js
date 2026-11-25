export function browserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return window.Notification.permission;
}

export async function requestBrowserNotificationPermission() {
  const permission = browserNotificationPermission();
  if (permission !== "default") return permission;
  return window.Notification.requestPermission();
}

export function showBrowserNotification(title, body, tag) {
  if (browserNotificationPermission() !== "granted") return false;
  const notification = new window.Notification(title, { body, tag });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  return true;
}
