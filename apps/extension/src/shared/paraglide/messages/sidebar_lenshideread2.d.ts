export { sidebar_lenshideread2 as "sidebar_lensHideRead" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lenshideread2Inputs = {
    count: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Hide {count} read" |
*
* @param {Sidebar_Lenshideread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lenshideread2: ((inputs: Sidebar_Lenshideread2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lenshideread2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
