import i18n from "@/app/i18n";
export const intlLocale = () =>
  i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
