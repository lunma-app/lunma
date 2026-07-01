/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Launcherscope1Inputs */

const en_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How the launcher ranks items that live in other Spaces`)
};

const es_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo el lanzador ordena elementos de otros espacios`)
};

const pt_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Como o launcher classifica itens de outros Espaços`)
};

const fr_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment le lanceur classe les éléments d'autres espaces`)
};

const de_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wie der Launcher Elemente aus anderen Räumen bewertet`)
};

const ja_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`他のスペースにあるアイテムの順位付け方法`)
};

const ko_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처가 다른 스페이스의 항목을 순위 매기는 방식`)
};

const zh_cn2_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`启动器如何排序其他空间中的内容`)
};

const ru_options_desc_launcherscope1 = /** @type {(inputs: Options_Desc_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Как лаунчер ранжирует элементы из других пространств`)
};

/**
* | output |
* | --- |
* | "How the launcher ranks items that live in other Spaces" |
*
* @param {Options_Desc_Launcherscope1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_launcherscope1 = /** @type {((inputs?: Options_Desc_Launcherscope1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Launcherscope1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_launcherscope1(inputs)
	if (locale === "es") return es_options_desc_launcherscope1(inputs)
	if (locale === "pt") return pt_options_desc_launcherscope1(inputs)
	if (locale === "fr") return fr_options_desc_launcherscope1(inputs)
	if (locale === "de") return de_options_desc_launcherscope1(inputs)
	if (locale === "ja") return ja_options_desc_launcherscope1(inputs)
	if (locale === "ko") return ko_options_desc_launcherscope1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_launcherscope1(inputs)
	return ru_options_desc_launcherscope1(inputs)
});
export { options_desc_launcherscope1 as "options_desc_launcherScope" }