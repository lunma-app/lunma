/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Minutesidlelabel2Inputs */

const en_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`minutes idle`)
};

const es_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`minutos inactivo`)
};

const pt_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`minutos inativo`)
};

const fr_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`minutes d'inactivité`)
};

const de_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minuten inaktiv`)
};

const ja_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`分アイドル後`)
};

const ko_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`분 유휴`)
};

const zh_cn2_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`分钟无操作`)
};

const ru_sidebar_minutesidlelabel2 = /** @type {(inputs: Sidebar_Minutesidlelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`минут простоя`)
};

/**
* | output |
* | --- |
* | "minutes idle" |
*
* @param {Sidebar_Minutesidlelabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_minutesidlelabel2 = /** @type {((inputs?: Sidebar_Minutesidlelabel2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Minutesidlelabel2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_minutesidlelabel2(inputs)
	if (locale === "es") return es_sidebar_minutesidlelabel2(inputs)
	if (locale === "pt") return pt_sidebar_minutesidlelabel2(inputs)
	if (locale === "fr") return fr_sidebar_minutesidlelabel2(inputs)
	if (locale === "de") return de_sidebar_minutesidlelabel2(inputs)
	if (locale === "ja") return ja_sidebar_minutesidlelabel2(inputs)
	if (locale === "ko") return ko_sidebar_minutesidlelabel2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_minutesidlelabel2(inputs)
	return ru_sidebar_minutesidlelabel2(inputs)
});
export { sidebar_minutesidlelabel2 as "sidebar_minutesIdleLabel" }