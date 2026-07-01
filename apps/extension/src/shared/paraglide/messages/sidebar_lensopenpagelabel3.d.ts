export { sidebar_lensopenpagelabel3 as "sidebar_lensOpenPageLabel" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lensopenpagelabel3Inputs = {
    name: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Open {name}" |
*
* @param {Sidebar_Lensopenpagelabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lensopenpagelabel3: ((inputs: Sidebar_Lensopenpagelabel3Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lensopenpagelabel3Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
