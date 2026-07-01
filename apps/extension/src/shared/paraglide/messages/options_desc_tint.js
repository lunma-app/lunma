/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_TintInputs */

const en_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How much the active Space's colour fills the workspace`)
};

const es_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuánto color del espacio activo llena el área de trabajo`)
};

const pt_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`O quanto a cor do Espaço ativo preenche o espaço de trabalho`)
};

const fr_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dans quelle mesure la couleur de l'espace actif remplit l'espace de travail`)
};

const de_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wie stark die Farbe des aktiven Raums den Arbeitsbereich füllt`)
};

const ja_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アクティブなスペースのカラーがワークスペースをどれだけ彩るか`)
};

const ko_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`활성 스페이스의 색상이 작업 공간을 채우는 정도`)
};

const zh_cn2_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`当前空间颜色对工作区的填充程度`)
};

const ru_options_desc_tint = /** @type {(inputs: Options_Desc_TintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Насколько цвет активного пространства заполняет интерфейс`)
};

/**
* | output |
* | --- |
* | "How much the active Space's colour fills the workspace" |
*
* @param {Options_Desc_TintInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_desc_tint = /** @type {((inputs?: Options_Desc_TintInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_TintInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_tint(inputs)
	if (locale === "es") return es_options_desc_tint(inputs)
	if (locale === "pt") return pt_options_desc_tint(inputs)
	if (locale === "fr") return fr_options_desc_tint(inputs)
	if (locale === "de") return de_options_desc_tint(inputs)
	if (locale === "ja") return ja_options_desc_tint(inputs)
	if (locale === "ko") return ko_options_desc_tint(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_tint(inputs)
	return ru_options_desc_tint(inputs)
});