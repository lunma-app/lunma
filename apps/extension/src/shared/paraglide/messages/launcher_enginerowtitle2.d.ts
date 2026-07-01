export { launcher_enginerowtitle2 as "launcher_engineRowTitle" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Enginerowtitle2Inputs = {
    engine: NonNullable<unknown>;
    query: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Search {engine} for \"{query}\"" |
*
* @param {Launcher_Enginerowtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_enginerowtitle2: ((inputs: Launcher_Enginerowtitle2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Enginerowtitle2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
