export { sidebar_spaceduplicate1 as "sidebar_spaceDuplicate" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Spaceduplicate1Inputs = {
    name: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "A space named \"{name}\" already exists." |
*
* @param {Sidebar_Spaceduplicate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_spaceduplicate1: ((inputs: Sidebar_Spaceduplicate1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Spaceduplicate1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
