/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensfilterbyfeed3Inputs */

const en_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filter by feed`)
};

const es_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar por fuente`)
};

const pt_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar por feed`)
};

const fr_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrer par flux`)
};

const de_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach Feed filtern`)
};

const ja_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィードで絞り込み`)
};

const ko_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`피드로 필터링`)
};

const zh_cn2_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`按订阅源筛选`)
};

const ru_launcher_lensfilterbyfeed3 = /** @type {(inputs: Launcher_Lensfilterbyfeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Фильтр по ленте`)
};

/**
* | output |
* | --- |
* | "Filter by feed" |
*
* @param {Launcher_Lensfilterbyfeed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensfilterbyfeed3 = /** @type {((inputs?: Launcher_Lensfilterbyfeed3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensfilterbyfeed3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensfilterbyfeed3(inputs)
	if (locale === "es") return es_launcher_lensfilterbyfeed3(inputs)
	if (locale === "pt") return pt_launcher_lensfilterbyfeed3(inputs)
	if (locale === "fr") return fr_launcher_lensfilterbyfeed3(inputs)
	if (locale === "de") return de_launcher_lensfilterbyfeed3(inputs)
	if (locale === "ja") return ja_launcher_lensfilterbyfeed3(inputs)
	if (locale === "ko") return ko_launcher_lensfilterbyfeed3(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensfilterbyfeed3(inputs)
	return ru_launcher_lensfilterbyfeed3(inputs)
});
export { launcher_lensfilterbyfeed3 as "launcher_lensFilterByFeed" }