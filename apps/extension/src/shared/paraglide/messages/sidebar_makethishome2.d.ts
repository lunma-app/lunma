export { sidebar_makethishome2 as "sidebar_makeThisHome" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Makethishome2Inputs = {};
/**
* | output |
* | --- |
* | "Make this home" |
*
* @param {Sidebar_Makethishome2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_makethishome2: ((inputs?: Sidebar_Makethishome2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Makethishome2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
