export { launcher_lensunread1 as "launcher_lensUnread" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensunread1Inputs = {
    count: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Unread · {count}" |
*
* @param {Launcher_Lensunread1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensunread1: ((inputs: Launcher_Lensunread1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensunread1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
