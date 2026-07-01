/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ feedUrl: NonNullable<unknown>, reach: NonNullable<unknown>, entity: NonNullable<unknown> }} Options_Feedreachline2Inputs */

const en_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · powers ${i?.entity}`)
};

const es_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · activa ${i?.entity}`)
};

const pt_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · alimenta ${i?.entity}`)
};

const fr_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · alimente ${i?.entity}`)
};

const de_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · ermöglicht ${i?.entity}`)
};

const ja_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · ${i?.entity} を提供`)
};

const ko_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · ${i?.entity} 구동`)
};

const zh_cn2_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · 驱动 ${i?.entity}`)
};

const ru_options_feedreachline2 = /** @type {(inputs: Options_Feedreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.feedUrl} · ${i?.reach} · обеспечивает ${i?.entity}`)
};

/**
* | output |
* | --- |
* | "{feedUrl} · {reach} · powers {entity}" |
*
* @param {Options_Feedreachline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedreachline2 = /** @type {((inputs: Options_Feedreachline2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedreachline2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_feedreachline2(inputs)
	if (locale === "es") return es_options_feedreachline2(inputs)
	if (locale === "pt") return pt_options_feedreachline2(inputs)
	if (locale === "fr") return fr_options_feedreachline2(inputs)
	if (locale === "de") return de_options_feedreachline2(inputs)
	if (locale === "ja") return ja_options_feedreachline2(inputs)
	if (locale === "ko") return ko_options_feedreachline2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_feedreachline2(inputs)
	return ru_options_feedreachline2(inputs)
});
export { options_feedreachline2 as "options_feedReachLine" }