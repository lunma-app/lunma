/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensfilterbyproject3Inputs */

const en_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filter by project`)
};

const es_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar por proyecto`)
};

const pt_pt2_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar por projeto`)
};

const fr_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrer par projet`)
};

const de_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach Projekt filtern`)
};

const ja_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`プロジェクトで絞り込み`)
};

const ko_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로젝트별 필터`)
};

const zh_cn2_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`按项目过滤`)
};

const ru_launcher_lensfilterbyproject3 = /** @type {(inputs: Launcher_Lensfilterbyproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Фильтр по проекту`)
};

/**
* | output |
* | --- |
* | "Filter by project" |
*
* @param {Launcher_Lensfilterbyproject3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensfilterbyproject3 = /** @type {((inputs?: Launcher_Lensfilterbyproject3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensfilterbyproject3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensfilterbyproject3(inputs)
	if (locale === "es") return es_launcher_lensfilterbyproject3(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_lensfilterbyproject3(inputs)
	if (locale === "fr") return fr_launcher_lensfilterbyproject3(inputs)
	if (locale === "de") return de_launcher_lensfilterbyproject3(inputs)
	if (locale === "ja") return ja_launcher_lensfilterbyproject3(inputs)
	if (locale === "ko") return ko_launcher_lensfilterbyproject3(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensfilterbyproject3(inputs)
	return ru_launcher_lensfilterbyproject3(inputs)
});
export { launcher_lensfilterbyproject3 as "launcher_lensFilterByProject" }