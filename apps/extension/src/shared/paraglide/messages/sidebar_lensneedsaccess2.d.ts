export { sidebar_lensneedsaccess2 as "sidebar_lensNeedsAccess" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lensneedsaccess2Inputs = {
    host: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Lunma needs access to {host}" |
*
* @param {Sidebar_Lensneedsaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lensneedsaccess2: ((inputs: Sidebar_Lensneedsaccess2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lensneedsaccess2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
