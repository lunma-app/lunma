/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Spacetooltipactivate2Inputs */

const en_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Activate ${i?.name}`)
};

const es_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Activar ${i?.name}`)
};

const pt_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ativar ${i?.name}`)
};

const fr_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Activer ${i?.name}`)
};

const de_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} aktivieren`)
};

const ja_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} をアクティベート`)
};

const ko_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} 활성화`)
};

const zh_cn2_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`激活 ${i?.name}`)
};

const ru_sidebar_spacetooltipactivate2 = /** @type {(inputs: Sidebar_Spacetooltipactivate2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Активировать ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Activate {name}" |
*
* @param {Sidebar_Spacetooltipactivate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacetooltipactivate2 = /** @type {((inputs: Sidebar_Spacetooltipactivate2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacetooltipactivate2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spacetooltipactivate2(inputs)
	if (locale === "es") return es_sidebar_spacetooltipactivate2(inputs)
	if (locale === "pt") return pt_sidebar_spacetooltipactivate2(inputs)
	if (locale === "fr") return fr_sidebar_spacetooltipactivate2(inputs)
	if (locale === "de") return de_sidebar_spacetooltipactivate2(inputs)
	if (locale === "ja") return ja_sidebar_spacetooltipactivate2(inputs)
	if (locale === "ko") return ko_sidebar_spacetooltipactivate2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spacetooltipactivate2(inputs)
	return ru_sidebar_spacetooltipactivate2(inputs)
});
export { sidebar_spacetooltipactivate2 as "sidebar_spaceTooltipActivate" }