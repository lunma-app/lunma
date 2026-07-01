export { sidebar_lenscouldnotreach3 as "sidebar_lensCouldNotReach" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lenscouldnotreach3Inputs = {
    host: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Couldn't reach {host}" |
*
* @param {Sidebar_Lenscouldnotreach3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lenscouldnotreach3: ((inputs: Sidebar_Lenscouldnotreach3Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lenscouldnotreach3Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
