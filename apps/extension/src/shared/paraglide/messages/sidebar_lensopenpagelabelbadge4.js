/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, badge: NonNullable<unknown>, kind: NonNullable<unknown> }} Sidebar_Lensopenpagelabelbadge4Inputs */

const en_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Open ${i?.name}, ${i?.badge} ${i?.kind}`)
};

const es_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Abrir ${i?.name}, ${i?.badge} ${i?.kind}`)
};

const pt_pt2_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Abrir ${i?.name}, ${i?.badge} ${i?.kind}`)
};

const fr_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ouvrir ${i?.name}, ${i?.badge} ${i?.kind}`)
};

const de_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} öffnen, ${i?.badge} ${i?.kind}`)
};

const ja_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} を開く、${i?.badge} ${i?.kind}`)
};

const ko_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} 열기, ${i?.badge} ${i?.kind}`)
};

const zh_cn2_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`打开 ${i?.name}，${i?.badge} 个${i?.kind}`)
};

const ru_sidebar_lensopenpagelabelbadge4 = /** @type {(inputs: Sidebar_Lensopenpagelabelbadge4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Открыть ${i?.name}, ${i?.badge} ${i?.kind}`)
};

/**
* | output |
* | --- |
* | "Open {name}, {badge} {kind}" |
*
* @param {Sidebar_Lensopenpagelabelbadge4Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenpagelabelbadge4 = /** @type {((inputs: Sidebar_Lensopenpagelabelbadge4Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenpagelabelbadge4Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "es") return es_sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "fr") return fr_sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "de") return de_sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "ja") return ja_sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "ko") return ko_sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensopenpagelabelbadge4(inputs)
	return ru_sidebar_lensopenpagelabelbadge4(inputs)
});
export { sidebar_lensopenpagelabelbadge4 as "sidebar_lensOpenPageLabelBadge" }