export { common_deselectall1 as "common_deselectAll" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Common_Deselectall1Inputs = {};
/**
* | output |
* | --- |
* | "Deselect all" |
*
* @param {Common_Deselectall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const common_deselectall1: ((inputs?: Common_Deselectall1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Deselectall1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
