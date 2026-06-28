export { sidebar_lenssigninto3 as "sidebar_lensSignInTo" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lenssigninto3Inputs = {
    host: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Sign in to {host}" |
*
* @param {Sidebar_Lenssigninto3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lenssigninto3: ((inputs: Sidebar_Lenssigninto3Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lenssigninto3Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
