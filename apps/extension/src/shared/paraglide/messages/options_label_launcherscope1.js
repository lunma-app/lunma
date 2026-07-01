/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Launcherscope1Inputs */

const en_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launcher scope`)
};

const es_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alcance del lanzador`)
};

const pt_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Âmbito do launcher`)
};

const fr_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portée du lanceur`)
};

const de_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launcher-Bereich`)
};

const ja_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーのスコープ`)
};

const ko_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처 범위`)
};

const zh_cn2_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`启动器范围`)
};

const ru_options_label_launcherscope1 = /** @type {(inputs: Options_Label_Launcherscope1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Область лаунчера`)
};

/**
* | output |
* | --- |
* | "Launcher scope" |
*
* @param {Options_Label_Launcherscope1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_launcherscope1 = /** @type {((inputs?: Options_Label_Launcherscope1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Launcherscope1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_launcherscope1(inputs)
	if (locale === "es") return es_options_label_launcherscope1(inputs)
	if (locale === "pt") return pt_options_label_launcherscope1(inputs)
	if (locale === "fr") return fr_options_label_launcherscope1(inputs)
	if (locale === "de") return de_options_label_launcherscope1(inputs)
	if (locale === "ja") return ja_options_label_launcherscope1(inputs)
	if (locale === "ko") return ko_options_label_launcherscope1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_launcherscope1(inputs)
	return ru_options_label_launcherscope1(inputs)
});
export { options_label_launcherscope1 as "options_label_launcherScope" }