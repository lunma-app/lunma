/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensfilterbyrepo3Inputs */

const en_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filter by repo`)
};

const es_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar por repositorio`)
};

const pt_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar por repositório`)
};

const fr_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrer par dépôt`)
};

const de_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach Repo filtern`)
};

const ja_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`リポジトリで絞り込み`)
};

const ko_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저장소별 필터`)
};

const zh_cn2_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`按仓库过滤`)
};

const ru_launcher_lensfilterbyrepo3 = /** @type {(inputs: Launcher_Lensfilterbyrepo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Фильтр по репозиторию`)
};

/**
* | output |
* | --- |
* | "Filter by repo" |
*
* @param {Launcher_Lensfilterbyrepo3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensfilterbyrepo3 = /** @type {((inputs?: Launcher_Lensfilterbyrepo3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensfilterbyrepo3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensfilterbyrepo3(inputs)
	if (locale === "es") return es_launcher_lensfilterbyrepo3(inputs)
	if (locale === "pt") return pt_launcher_lensfilterbyrepo3(inputs)
	if (locale === "fr") return fr_launcher_lensfilterbyrepo3(inputs)
	if (locale === "de") return de_launcher_lensfilterbyrepo3(inputs)
	if (locale === "ja") return ja_launcher_lensfilterbyrepo3(inputs)
	if (locale === "ko") return ko_launcher_lensfilterbyrepo3(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensfilterbyrepo3(inputs)
	return ru_launcher_lensfilterbyrepo3(inputs)
});
export { launcher_lensfilterbyrepo3 as "launcher_lensFilterByRepo" }