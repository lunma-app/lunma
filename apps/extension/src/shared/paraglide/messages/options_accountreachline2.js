/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ reach: NonNullable<unknown>, entity: NonNullable<unknown> }} Options_Accountreachline2Inputs */

const en_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · powers ${i?.entity}`)
};

const es_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · activa ${i?.entity}`)
};

const pt_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · alimenta ${i?.entity}`)
};

const fr_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · alimente ${i?.entity}`)
};

const de_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · ermöglicht ${i?.entity}`)
};

const ja_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · ${i?.entity} を提供`)
};

const ko_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · ${i?.entity} 구동`)
};

const zh_cn2_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · 驱动 ${i?.entity}`)
};

const ru_options_accountreachline2 = /** @type {(inputs: Options_Accountreachline2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.reach} · обеспечивает ${i?.entity}`)
};

/**
* | output |
* | --- |
* | "{reach} · powers {entity}" |
*
* @param {Options_Accountreachline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountreachline2 = /** @type {((inputs: Options_Accountreachline2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountreachline2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_accountreachline2(inputs)
	if (locale === "es") return es_options_accountreachline2(inputs)
	if (locale === "pt") return pt_options_accountreachline2(inputs)
	if (locale === "fr") return fr_options_accountreachline2(inputs)
	if (locale === "de") return de_options_accountreachline2(inputs)
	if (locale === "ja") return ja_options_accountreachline2(inputs)
	if (locale === "ko") return ko_options_accountreachline2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_accountreachline2(inputs)
	return ru_options_accountreachline2(inputs)
});
export { options_accountreachline2 as "options_accountReachLine" }