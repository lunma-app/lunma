export { launcher_metaline1 as "launcher_metaLine" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Metaline1Inputs = {
    tabCount: NonNullable<unknown>;
    pinnedCount: NonNullable<unknown>;
};
/**
* | tabPlural | output |
* | --- | --- |
* | "one" | "{tabCount} tab · {pinnedCount} pinned" |
* | "other" | "{tabCount} tabs · {pinnedCount} pinned" |
*
* @param {Launcher_Metaline1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_metaline1: ((inputs: Launcher_Metaline1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Metaline1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
