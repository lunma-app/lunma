/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ host: NonNullable<unknown> }} Sidebar_Lenscouldnotreach3Inputs */

const en_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Couldn't reach ${i?.host}`)
};

const es_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`No se pudo conectar a ${i?.host}`)
};

const pt_pt2_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Não foi possível ligar a ${i?.host}`)
};

const fr_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Impossible d'atteindre ${i?.host}`)
};

const de_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.host} nicht erreichbar`)
};

const ja_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.host} に接続できませんでした`)
};

const ko_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.host}에 연결할 수 없습니다`)
};

const zh_cn2_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`无法访问 ${i?.host}`)
};

const ru_sidebar_lenscouldnotreach3 = /** @type {(inputs: Sidebar_Lenscouldnotreach3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Не удалось подключиться к ${i?.host}`)
};

/**
* | output |
* | --- |
* | "Couldn't reach {host}" |
*
* @param {Sidebar_Lenscouldnotreach3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscouldnotreach3 = /** @type {((inputs: Sidebar_Lenscouldnotreach3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscouldnotreach3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lenscouldnotreach3(inputs)
	if (locale === "es") return es_sidebar_lenscouldnotreach3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lenscouldnotreach3(inputs)
	if (locale === "fr") return fr_sidebar_lenscouldnotreach3(inputs)
	if (locale === "de") return de_sidebar_lenscouldnotreach3(inputs)
	if (locale === "ja") return ja_sidebar_lenscouldnotreach3(inputs)
	if (locale === "ko") return ko_sidebar_lenscouldnotreach3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lenscouldnotreach3(inputs)
	return ru_sidebar_lenscouldnotreach3(inputs)
});
export { sidebar_lenscouldnotreach3 as "sidebar_lensCouldNotReach" }