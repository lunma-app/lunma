export { sidebar_newfolder1 as "sidebar_newFolder" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Newfolder1Inputs = {};
/**
* | output |
* | --- |
* | "New folder" |
*
* @param {Sidebar_Newfolder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_newfolder1: ((inputs?: Sidebar_Newfolder1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Newfolder1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
