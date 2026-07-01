export { sidebar_lensshowread2 as "sidebar_lensShowRead" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lensshowread2Inputs = {
    count: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Show {count} read" |
*
* @param {Sidebar_Lensshowread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lensshowread2: ((inputs: Sidebar_Lensshowread2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lensshowread2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
