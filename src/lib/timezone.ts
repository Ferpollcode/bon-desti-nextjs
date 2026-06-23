export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const APP_TIME_ZONE_OFFSET = "-03:00";

type DateFormatOptions = Intl.DateTimeFormatOptions;

export function formatDateTime(value: string | Date, options: DateFormatOptions) {
  return new Date(value).toLocaleString("es-AR", {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}

export function formatDate(value: string | Date, options: DateFormatOptions) {
  return new Date(value).toLocaleDateString("es-AR", {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}

export function formatTime(value: string | Date, options: DateFormatOptions) {
  return new Date(value).toLocaleTimeString("es-AR", {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}

export function localDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function tomorrowLocalDateString(date = new Date()) {
  const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  return localDateString(nextDay);
}

export function startOfLocalDayIso(dateString = localDateString()) {
  return `${dateString}T00:00:00${APP_TIME_ZONE_OFFSET}`;
}

export function endOfLocalDayIso(dateString: string) {
  return `${dateString}T23:59:59${APP_TIME_ZONE_OFFSET}`;
}

export function localWeekday(date = new Date()) {
  const dateString = localDateString(date);
  return new Date(`${dateString}T00:00:00Z`).getUTCDay();
}

export function localTimeString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("hour")}:${get("minute")}`;
}
