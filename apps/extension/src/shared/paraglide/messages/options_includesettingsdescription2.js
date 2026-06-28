/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Includesettingsdescription2Inputs */

const en_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carry your preferences to the new machine.`)
};

const es_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lleva tus preferencias al nuevo equipo.`)
};

const pt_pt2_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leve as suas preferências para a nova máquina.`)
};

const fr_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emportez vos préférences sur le nouvel appareil.`)
};

const de_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einstellungen auf das neue Gerät mitnehmen.`)
};

const ja_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`設定を新しいマシンに引き継ぎます。`)
};

const ko_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 기기에 설정을 가져갑니다.`)
};

const zh_cn2_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`将偏好设置一并带到新设备`)
};

const ru_options_includesettingsdescription2 = /** @type {(inputs: Options_Includesettingsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Перенесите настройки на новое устройство.`)
};

/**
* | output |
* | --- |
* | "Carry your preferences to the new machine." |
*
* @param {Options_Includesettingsdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_includesettingsdescription2 = /** @type {((inputs?: Options_Includesettingsdescription2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Includesettingsdescription2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_includesettingsdescription2(inputs)
	if (locale === "es") return es_options_includesettingsdescription2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_includesettingsdescription2(inputs)
	if (locale === "fr") return fr_options_includesettingsdescription2(inputs)
	if (locale === "de") return de_options_includesettingsdescription2(inputs)
	if (locale === "ja") return ja_options_includesettingsdescription2(inputs)
	if (locale === "ko") return ko_options_includesettingsdescription2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_includesettingsdescription2(inputs)
	return ru_options_includesettingsdescription2(inputs)
});
export { options_includesettingsdescription2 as "options_includeSettingsDescription" }