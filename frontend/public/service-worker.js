self.addEventListener('push', event => {
  // حماية من عدم وجود بيانات أو بيانات غير صالحة
  if (!event.data) {
    console.warn('Push received with no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    console.error('Invalid JSON in push payload', err);
    return;
  }

  // قيم افتراضية ذكية
  const title   = payload.title   || 'إشعار جديد';
  const message = payload.message || 'لديك رسالة جديدة';
  const url     = payload.url     || '/';

  const options = {
    body: message,
    icon: payload.icon || '/icon-192.png',   // ممكن تيجي من الـ backend
    badge: '/badge.png',                     // اختياري – شكل أفضل على ويندوز
    data: {
      url: url                               // نضعها داخل كائن data
    },
    tag: payload.tag || 'general-notification',  // اختياري – مفيد جدًا
    renotify: !!payload.tag                  // اختياري – يهز الإشعار لو نفس الـ tag
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(err => console.error('Failed to show notification', err))
  );
});


self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientsArr => {
        // هل في تاب مفتوح بنفس الـ URL؟
        const hadWindowToFocus = clientsArr.some(client => {
          if (client.url === targetUrl && 'focus' in client) {
            client.focus();
            return true;
          }
          return false;
        });

        // لو مالقيناش → نفتح واحد جديد
        if (!hadWindowToFocus && 'openWindow' in clients) {
          return clients.openWindow(targetUrl);
        }
      })
      .catch(err => {
        console.error('Error handling notification click', err);
        // fallback: على الأقل نحاول نفتح
        if ('openWindow' in clients) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});