export { launcher_resultstatus1 as "launcher_resultStatus" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Resultstatus1Inputs = {
    count: NonNullable<unknown>;
};
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} result" |
* | "other" | "{count} results" |
*
* @param {Launcher_Resultstatus1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_resultstatus1: ((inputs: Launcher_Resultstatus1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Resultstatus1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
