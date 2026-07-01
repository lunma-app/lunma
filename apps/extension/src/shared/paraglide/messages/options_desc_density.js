/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_DensityInputs */

const en_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How much space rows use — across tabs and launcher results`)
};

const es_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Espacio que usan las filas — en pestañas y resultados del lanzador`)
};

const pt_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Espaço usado pelas linhas — em separadores e resultados`)
};

const fr_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'espace utilisé par les lignes — onglets et résultats du lanceur`)
};

const de_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wie viel Platz Zeilen einnehmen — in Tabs und Launcher-Ergebnissen`)
};

const ja_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`行の間隔 — タブとランチャー結果全体`)
};

const ko_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탭과 런처 결과에서 행이 사용하는 공간`)
};

const zh_cn2_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`行间距 — 适用于标签页和启动器结果`)
};

const ru_options_desc_density = /** @type {(inputs: Options_Desc_DensityInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Размер строк — в списках вкладок и результатах лаунчера`)
};

/**
* | output |
* | --- |
* | "How much space rows use — across tabs and launcher results" |
*
* @param {Options_Desc_DensityInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_desc_density = /** @type {((inputs?: Options_Desc_DensityInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_DensityInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_density(inputs)
	if (locale === "es") return es_options_desc_density(inputs)
	if (locale === "pt") return pt_options_desc_density(inputs)
	if (locale === "fr") return fr_options_desc_density(inputs)
	if (locale === "de") return de_options_desc_density(inputs)
	if (locale === "ja") return ja_options_desc_density(inputs)
	if (locale === "ko") return ko_options_desc_density(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_density(inputs)
	return ru_options_desc_density(inputs)
});