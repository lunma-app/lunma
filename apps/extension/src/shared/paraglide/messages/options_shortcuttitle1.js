/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Shortcuttitle1Inputs */

const en_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set the launcher shortcut`)
};

const es_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurar el atajo del lanzador`)
};

const pt_pt2_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Definir atalho do launcher`)
};

const fr_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer le raccourci du lanceur`)
};

const de_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launcher-Tastenkürzel festlegen`)
};

const ja_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーのショートカットを設定`)
};

const ko_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처 단축키 설정`)
};

const zh_cn2_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`设置启动器快捷键`)
};

const ru_options_shortcuttitle1 = /** @type {(inputs: Options_Shortcuttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Задать горячую клавишу лаунчера`)
};

/**
* | output |
* | --- |
* | "Set the launcher shortcut" |
*
* @param {Options_Shortcuttitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_shortcuttitle1 = /** @type {((inputs?: Options_Shortcuttitle1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Shortcuttitle1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_shortcuttitle1(inputs)
	if (locale === "es") return es_options_shortcuttitle1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_shortcuttitle1(inputs)
	if (locale === "fr") return fr_options_shortcuttitle1(inputs)
	if (locale === "de") return de_options_shortcuttitle1(inputs)
	if (locale === "ja") return ja_options_shortcuttitle1(inputs)
	if (locale === "ko") return ko_options_shortcuttitle1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_shortcuttitle1(inputs)
	return ru_options_shortcuttitle1(inputs)
});
export { options_shortcuttitle1 as "options_shortcutTitle" }