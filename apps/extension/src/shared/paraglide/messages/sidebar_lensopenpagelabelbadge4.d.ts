export { sidebar_lensopenpagelabelbadge4 as "sidebar_lensOpenPageLabelBadge" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lensopenpagelabelbadge4Inputs = {
    name: NonNullable<unknown>;
    badge: NonNullable<unknown>;
    kind: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Open {name}, {badge} {kind}" |
*
* @param {Sidebar_Lensopenpagelabelbadge4Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lensopenpagelabelbadge4: ((inputs: Sidebar_Lensopenpagelabelbadge4Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lensopenpagelabelbadge4Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
