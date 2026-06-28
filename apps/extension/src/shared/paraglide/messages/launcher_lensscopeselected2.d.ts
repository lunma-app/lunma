export { launcher_lensscopeselected2 as "launcher_lensScopeSelected" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensscopeselected2Inputs = {
    count: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "{count} selected" |
*
* @param {Launcher_Lensscopeselected2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensscopeselected2: ((inputs: Launcher_Lensscopeselected2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensscopeselected2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
