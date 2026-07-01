export { sidebar_lensreconnect1 as "sidebar_lensReconnect" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lensreconnect1Inputs = {
    host: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Reconnect {host}" |
*
* @param {Sidebar_Lensreconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lensreconnect1: ((inputs: Sidebar_Lensreconnect1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lensreconnect1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
